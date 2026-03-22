// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, InEuint64, ebool, InEbool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// @title EncryptedERC20 (EUSDC)
/// @notice FHERC20 with faucet + authorised transfer for Fhenix DEX.
///         Faucet gives 10,000 EUSDC per wallet every 2 hours.
contract EncryptedERC20 {
    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event Mint(address indexed to, uint64 amount);
    event FaucetClaim(address indexed to, uint64 amount);

    uint64 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;
    address public owner;

    uint64 public constant FAUCET_AMOUNT = 10_000 * 10**6;
    uint256 public constant FAUCET_COOLDOWN = 2 hours;

    mapping(address => euint64) internal _balances;
    mapping(address => mapping(address => euint64)) internal _allowances;
    mapping(address => uint256) public lastFaucetClaim;

    mapping(address => bool) public authorisedMinters;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == owner || authorisedMinters[msg.sender], "Not authorised");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 6;
        owner = msg.sender;
    }

    function setMinter(address minter, bool authorised) external onlyOwner {
        authorisedMinters[minter] = authorised;
    }

    // ── Balance initialization helper ──────────────────────
    // FHE ops crash on uninitialized euint64 handles (bytes32(0)).
    // This ensures every address has a valid encrypted 0 before
    // any arithmetic is attempted.

    function _initBalance(address account) internal {
        if (euint64.unwrap(_balances[account]) == bytes32(0)) {
            _balances[account] = FHE.asEuint64(0);
            FHE.allowThis(_balances[account]);
            FHE.allow(_balances[account], account);
        }
    }

    // ── Faucet ─────────────────────────────────────────────

    function claimFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: wait 2 hours between claims"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;

        _initBalance(msg.sender);

        euint64 eAmount = FHE.asEuint64(FAUCET_AMOUNT);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], eAmount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowSender(_balances[msg.sender]);

        totalSupply += FAUCET_AMOUNT;
        emit FaucetClaim(msg.sender, FAUCET_AMOUNT);
    }

    function faucetCooldownRemaining(address user) external view returns (uint256) {
        uint256 nextClaim = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }

    // ── Standard FHERC20 ───────────────────────────────────

    function mint(uint64 amount) public {
        _initBalance(msg.sender);

        euint64 eAmount = FHE.asEuint64(amount);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], eAmount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowSender(_balances[msg.sender]);
        totalSupply += amount;
        emit Mint(msg.sender, amount);
    }

    function mintTo(address to, uint64 amount) external onlyMinter {
        _initBalance(to);

        euint64 eAmount = FHE.asEuint64(amount);
        _balances[to] = FHE.add(_balances[to], eAmount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        totalSupply += amount;
        emit Mint(to, amount);
    }

    /// @notice Authorised transfer — ShadowPool can move tokens without approval.
    function authorisedTransferFrom(address from, address to, euint64 amount) external onlyMinter {
        _transfer(from, to, amount);
    }

    function transfer(address to, InEuint64 calldata amount) public {
        _transfer(msg.sender, to, FHE.asEuint64(amount));
    }

    function transfer(address to, euint64 amount) public {
        _transfer(msg.sender, to, amount);
    }

    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        ebool canTransfer = FHE.lte(amount, _balances[from]);
        euint64 amountToTransfer = FHE.select(canTransfer, amount, FHE.asEuint64(0));

        _balances[from] = FHE.sub(_balances[from], amountToTransfer);
        _balances[to] = FHE.add(_balances[to], amountToTransfer);

        FHE.allowThis(_balances[from]);
        FHE.allow(_balances[from], from);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transfer(from, to);
    }

    function approve(address spender, InEuint64 calldata amount) public {
        _approve(msg.sender, spender, FHE.asEuint64(amount));
    }

    function approve(address spender, euint64 amount) public {
        _approve(msg.sender, spender, amount);
    }

    function _approve(address owner_, address spender, euint64 amount) internal {
        _allowances[owner_][spender] = amount;
        FHE.allowThis(_allowances[owner_][spender]);
        FHE.allow(_allowances[owner_][spender], owner_);
        FHE.allow(_allowances[owner_][spender], spender);
        emit Approval(owner_, spender);
    }

    function transferFrom(address from, address to, InEuint64 calldata amount) public {
        _transferFrom(from, to, FHE.asEuint64(amount));
    }

    function transferFrom(address from, address to, euint64 amount) public {
        _transferFrom(from, to, amount);
    }

    function _transferFrom(address from, address to, euint64 amount) internal {
        if (euint64.unwrap(_allowances[from][msg.sender]) == bytes32(0)) {
            _allowances[from][msg.sender] = FHE.asEuint64(0);
            FHE.allowThis(_allowances[from][msg.sender]);
            FHE.allow(_allowances[from][msg.sender], from);
            FHE.allow(_allowances[from][msg.sender], msg.sender);
        }

        ebool canTransfer = FHE.lte(amount, _allowances[from][msg.sender]);
        euint64 amountToTransfer = FHE.select(canTransfer, amount, FHE.asEuint64(0));

        _allowances[from][msg.sender] = FHE.sub(_allowances[from][msg.sender], amountToTransfer);
        FHE.allowThis(_allowances[from][msg.sender]);
        FHE.allow(_allowances[from][msg.sender], from);
        FHE.allow(_allowances[from][msg.sender], msg.sender);

        _transfer(from, to, amountToTransfer);
    }

    function balanceOf(address account) public view returns (euint64) {
        return _balances[account];
    }

    function allowance(address owner_, address spender) public view returns (euint64) {
        return _allowances[owner_][spender];
    }
}
