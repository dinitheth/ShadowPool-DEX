// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, InEuint64, ebool, InEbool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface IEncryptedERC20 {
    function transfer(address to, InEuint64 calldata amount) external;
    function transfer(address to, euint64 amount) external;
    function transferFrom(address from, address to, InEuint64 calldata amount) external;
    function transferFrom(address from, address to, euint64 amount) external;
    function mintTo(address to, uint64 amount) external;
    function authorisedTransferFrom(address from, address to, euint64 amount) external;
    function balanceOf(address account) external view returns (euint64);
}

/// @title ShadowPool — Confidential Perps DEX with Real Settlement
/// @notice All orders fully FHE encrypted. Margin locked on submit.
///         Settlement via authorised operator returns margin ± PnL.
contract ShadowPool {
    IEncryptedERC20 public immutable marginToken;
    address public owner;

    struct EncryptedOrder {
        euint64 price;
        euint64 amount;
        ebool   isLong;
        address trader;
        uint256 timestamp;
        bool    isActive;
        bool    isClosed;
    }

    struct EncryptedPosition {
        euint64 size;
        euint64 margin;
        euint64 entryPrice;
        ebool   isLong;
        bool    isActive;
    }

    struct MatchRecord {
        uint256 orderId1;
        uint256 orderId2;
        euint64 fillAmount;
        euint64 fillPrice;
        uint256 timestamp;
    }

    struct Settlement {
        uint256 orderId;
        address trader;
        uint64  returnAmount; // total USDC returned to trader
        bool    isProfit;     // was this a profitable trade?
        uint256 timestamp;
    }

    mapping(uint256 => EncryptedOrder) public orders;
    uint256 public orderCount;

    mapping(uint256 => MatchRecord) public matches;
    uint256 public matchCount;

    mapping(address => uint256[]) private traderOrders;
    mapping(address => EncryptedPosition) public positions;

    mapping(uint256 => Settlement) public settlements;
    uint256 public poolBalance;

    event OrderSubmitted(uint256 indexed orderId, address indexed trader);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event OrdersMatched(uint256 indexed matchId, uint256 indexed orderId1, uint256 indexed orderId2);
    event MarginDeposited(address indexed trader);
    event PositionClosed(address indexed trader, uint256 indexed orderId);
    event PoolFunded(address indexed funder, uint64 amount);
    event PoolWithdrawn(address indexed owner, uint64 amount);
    event PositionSettled(uint256 indexed orderId, address indexed trader, uint64 returnAmount, bool isProfit);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _marginToken) {
        marginToken = IEncryptedERC20(_marginToken);
        owner = msg.sender;
    }

    // ── Pool Management (Owner) ───────────────────────────────

    function fundPool(uint64 amount) external onlyOwner {
        marginToken.mintTo(address(this), amount);
        poolBalance += amount;
        emit PoolFunded(msg.sender, amount);
    }

    function withdrawPool(uint64 amount) external onlyOwner {
        require(poolBalance >= amount, "Insufficient pool balance");
        poolBalance -= amount;
        euint64 eAmount = FHE.asEuint64(amount);
        FHE.allowThis(eAmount);
        marginToken.transfer(owner, eAmount);
        emit PoolWithdrawn(msg.sender, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ── Margin Management ──────────────────────────────────

    function depositMargin(InEuint64 calldata encryptedAmount) external {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        marginToken.transferFrom(msg.sender, address(this), amount);

        EncryptedPosition storage pos = positions[msg.sender];
        pos.margin = FHE.add(pos.margin, amount);
        FHE.allowThis(pos.margin);
        FHE.allowSender(pos.margin);
        emit MarginDeposited(msg.sender);
    }

    // ── Order Management (FHE Encrypted + Margin Lock) ────

    function submitOrder(
        InEuint64 calldata _price,
        InEuint64 calldata _amount,
        InEbool calldata _isLong
    ) external {
        euint64 price = FHE.asEuint64(_price);
        euint64 amount = FHE.asEuint64(_amount);
        ebool isLong = FHE.asEbool(_isLong);

        // Lock margin: transfer encrypted amount from trader to pool
        // Grant marginToken contract access to the ciphertext handle
        // (FHE handles created here are ShadowPool-scoped by default)
        FHE.allow(amount, address(marginToken));
        marginToken.authorisedTransferFrom(msg.sender, address(this), amount);

        uint256 orderId = orderCount;

        orders[orderId] = EncryptedOrder({
            price: price,
            amount: amount,
            isLong: isLong,
            trader: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            isClosed: false
        });

        traderOrders[msg.sender].push(orderId);
        orderCount++;

        FHE.allowThis(price);
        FHE.allowSender(price);
        FHE.allowThis(amount);
        FHE.allowSender(amount);
        FHE.allowThis(isLong);
        FHE.allowSender(isLong);

        emit OrderSubmitted(orderId, msg.sender);
    }

    function cancelOrder(uint256 orderId) external {
        EncryptedOrder storage order = orders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.isActive, "Already inactive");
        order.isActive = false;
        order.isClosed = true;

        // Mark as settled with full refund (isProfit = false, trader gets margin back)
        // This is handled via the settlement path for simplicity.
        // The operator must call settlePosition with the full margin as returnAmount.
        emit OrderCancelled(orderId, msg.sender);
    }

    // ── Close Position ─────────────────────────────────────

    function closePosition(uint256 orderId) external {
        EncryptedOrder storage order = orders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.isActive, "Already inactive");
        require(!order.isClosed, "Already closed");

        order.isActive = false;
        order.isClosed = true;

        emit PositionClosed(msg.sender, orderId);
    }

    // ── Settlement (Owner/Operator) ────────────────────────

    /// @notice Settle a closed position — return margin ± PnL to trader.
    ///         Operator computes off-chain from decrypted data:
    ///           profit:  returnAmount = margin + PnL (pool pays the profit)
    ///           loss:    returnAmount = margin - |PnL| (pool keeps the loss)
    /// @param orderId The order to settle
    /// @param returnAmount Total USDC to return to trader
    /// @param isProfit Whether the trade was profitable
    function settlePosition(
        uint256 orderId,
        uint64 returnAmount,
        bool isProfit
    ) external onlyOwner {
        EncryptedOrder storage order = orders[orderId];
        require(order.isClosed, "Not closed");
        require(settlements[orderId].timestamp == 0, "Already settled");

        address trader = order.trader;

        if (returnAmount > 0) {
            if (isProfit) {
                // Winner: pool pays the profit portion
                // returnAmount = margin + profit, pool covers the profit
                require(poolBalance >= returnAmount, "Insufficient pool balance for payout");
                poolBalance -= returnAmount;
            }
            // Mint the return amount to trader (margin return + profit or margin - loss)
            marginToken.mintTo(trader, returnAmount);
        } else {
            // Full liquidation: trader gets nothing, pool keeps margin
            // poolBalance doesn't change since margin was already locked
        }

        settlements[orderId] = Settlement({
            orderId: orderId,
            trader: trader,
            returnAmount: returnAmount,
            isProfit: isProfit,
            timestamp: block.timestamp
        });

        emit PositionSettled(orderId, trader, returnAmount, isProfit);
    }

    // ── Matching Engine (FHE Encrypted) ────────────────────

    function matchOrders(uint256 orderId1, uint256 orderId2) external {
        EncryptedOrder storage o1 = orders[orderId1];
        EncryptedOrder storage o2 = orders[orderId2];

        require(o1.isActive && o2.isActive, "Inactive order");
        require(o1.trader != o2.trader, "Self-match");

        ebool sidesMatch = FHE.ne(o1.isLong, o2.isLong);
        euint64 longPrice = FHE.select(o1.isLong, o1.price, o2.price);
        euint64 shortPrice = FHE.select(o1.isLong, o2.price, o1.price);
        ebool priceMatch = FHE.gte(longPrice, shortPrice);
        ebool isValidMatch = FHE.and(sidesMatch, priceMatch);

        euint64 fillAmount = FHE.min(o1.amount, o2.amount);
        euint64 fillPrice = shortPrice;

        euint64 newAmount1 = FHE.select(isValidMatch, FHE.sub(o1.amount, fillAmount), o1.amount);
        euint64 newAmount2 = FHE.select(isValidMatch, FHE.sub(o2.amount, fillAmount), o2.amount);

        o1.amount = newAmount1;
        o2.amount = newAmount2;

        FHE.allowThis(o1.amount);
        FHE.allow(o1.amount, o1.trader);
        FHE.allowThis(o2.amount);
        FHE.allow(o2.amount, o2.trader);

        _updatePosition(o1.trader, fillAmount, fillPrice, o1.isLong, isValidMatch);
        _updatePosition(o2.trader, fillAmount, fillPrice, o2.isLong, isValidMatch);

        uint256 matchId = matchCount;
        matches[matchId] = MatchRecord({
            orderId1: orderId1,
            orderId2: orderId2,
            fillAmount: fillAmount,
            fillPrice: fillPrice,
            timestamp: block.timestamp
        });
        matchCount++;

        emit OrdersMatched(matchId, orderId1, orderId2);
    }

    function _updatePosition(
        address trader,
        euint64 fillAmount,
        euint64 fillPrice,
        ebool isLong,
        ebool isValidMatch
    ) internal {
        EncryptedPosition storage pos = positions[trader];
        euint64 actualFill = FHE.select(isValidMatch, fillAmount, FHE.asEuint64(0));

        pos.size = FHE.add(pos.size, actualFill);
        pos.entryPrice = FHE.select(FHE.eq(pos.size, actualFill), fillPrice, pos.entryPrice);
        pos.isLong = FHE.select(FHE.eq(pos.size, actualFill), isLong, pos.isLong);

        if (euint64.unwrap(pos.margin) == bytes32(0)) {
            pos.margin = FHE.asEuint64(0);
        }

        pos.isActive = true;

        FHE.allowThis(pos.size);
        FHE.allow(pos.size, trader);
        FHE.allowThis(pos.entryPrice);
        FHE.allow(pos.entryPrice, trader);
        FHE.allowThis(pos.isLong);
        FHE.allow(pos.isLong, trader);
        FHE.allowThis(pos.margin);
        FHE.allow(pos.margin, trader);
    }

    // ── View Functions ─────────────────────────────────────

    function getOrderAmount(uint256 orderId) external view returns (euint64) {
        require(orders[orderId].trader == msg.sender, "Not your order");
        return orders[orderId].amount;
    }

    function getPositionSize() external view returns (euint64) {
        return positions[msg.sender].size;
    }

    function getPositionMargin() external view returns (euint64) {
        return positions[msg.sender].margin;
    }

    function getPositionEntryPrice() external view returns (euint64) {
        return positions[msg.sender].entryPrice;
    }

    function getTraderOrders(address trader) external view returns (uint256[] memory) {
        return traderOrders[trader];
    }

    function isOrderClosed(uint256 orderId) external view returns (bool) {
        return orders[orderId].isClosed;
    }

    function isOrderSettled(uint256 orderId) external view returns (bool) {
        return settlements[orderId].timestamp > 0;
    }

    function getSettlement(uint256 orderId) external view returns (
        address trader,
        uint64 returnAmount,
        bool isProfit,
        uint256 timestamp
    ) {
        Settlement storage s = settlements[orderId];
        return (s.trader, s.returnAmount, s.isProfit, s.timestamp);
    }
}
