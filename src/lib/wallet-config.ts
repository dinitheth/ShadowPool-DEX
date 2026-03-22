import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Fhenix is deployed on Ethereum Sepolia — CoFHE coprocessor handles FHE ops
export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});

// ──────────────────────────────────────────────
//  Deployed contract addresses on Ethereum Sepolia
// ──────────────────────────────────────────────
export const ENCRYPTED_ERC20_ADDRESS = "0x2a78f79f965dbee8b6a7fc85937e011673b37d48" as `0x${string}`;
export const SHADOW_POOL_ADDRESS = "0x38a10c48db7b86f8b67ac75427d70ea06a5ab2dd" as `0x${string}`;

// ──────────────────────────────────────────────
//  EncryptedERC20 ABI (includes faucet)
// ──────────────────────────────────────────────
export const ENCRYPTED_ERC20_ABI = [
  // Faucet
  {
    name: "claimFaucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "faucetCooldownRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "lastFaucetClaim",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "FAUCET_AMOUNT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    name: "FAUCET_COOLDOWN",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Standard ERC20
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint64" }],
    outputs: [],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  // Events
  {
    name: "FaucetClaim",
    type: "event",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint64", indexed: false },
    ],
  },
  {
    name: "Mint",
    type: "event",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint64", indexed: false },
    ],
  },
  // Owner functions
  {
    name: "mintTo",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint64" },
    ],
    outputs: [],
  },
  {
    name: "setMinter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "minter", type: "address" },
      { name: "authorised", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ──────────────────────────────────────────────
//  ShadowPool ABI (with settlement & close position)
// ──────────────────────────────────────────────
export const SHADOW_POOL_ABI = [
  // Order Management
  {
    name: "submitOrder",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_price",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      {
        name: "_amount",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
      {
        name: "_isLong",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "cancelOrder",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [],
  },
  // Close Position (marks position as closed)
  {
    name: "closePosition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "matchOrders",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId1", type: "uint256" },
      { name: "orderId2", type: "uint256" },
    ],
    outputs: [],
  },
  // Margin Management
  {
    name: "depositMargin",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "encryptedAmount",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "uint8" },
          { name: "utype", type: "uint8" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
  // View Functions
  {
    name: "orderCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "matchCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getOrderAmount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getPositionSize",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getPositionMargin",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getPositionEntryPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getTraderOrders",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "trader", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "isOrderClosed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "orders",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "price", type: "bytes32" },
      { name: "amount", type: "bytes32" },
      { name: "isLong", type: "bytes32" },
      { name: "trader", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "isClosed", type: "bool" },
    ],
  },
  {
    name: "matches",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "orderId1", type: "uint256" },
      { name: "orderId2", type: "uint256" },
      { name: "fillAmount", type: "bytes32" },
      { name: "fillPrice", type: "bytes32" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "positions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "size", type: "bytes32" },
      { name: "margin", type: "bytes32" },
      { name: "entryPrice", type: "bytes32" },
      { name: "isLong", type: "bytes32" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    name: "marginToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Events
  {
    name: "OrderSubmitted",
    type: "event",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "trader", type: "address", indexed: true },
    ],
  },
  {
    name: "OrderCancelled",
    type: "event",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "trader", type: "address", indexed: true },
    ],
  },
  {
    name: "OrdersMatched",
    type: "event",
    inputs: [
      { name: "matchId", type: "uint256", indexed: true },
      { name: "orderId1", type: "uint256", indexed: true },
      { name: "orderId2", type: "uint256", indexed: true },
    ],
  },
  {
    name: "MarginDeposited",
    type: "event",
    inputs: [
      { name: "trader", type: "address", indexed: true },
    ],
  },
  {
    name: "PositionClosed",
    type: "event",
    inputs: [
      { name: "trader", type: "address", indexed: true },
      { name: "orderId", type: "uint256", indexed: true },
    ],
  },
  // Settlement functions (owner/operator)
  {
    name: "settlePosition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "pnlAmount", type: "uint64" },
      { name: "isProfit", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "fundPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint64" }],
    outputs: [],
  },
  {
    name: "withdrawPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint64" }],
    outputs: [],
  },
  {
    name: "poolBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "isOrderSettled",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getSettlement",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [
      { name: "trader", type: "address" },
      { name: "pnlAmount", type: "uint64" },
      { name: "isProfit", type: "bool" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "settlements",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "orderId", type: "uint256" },
      { name: "trader", type: "address" },
      { name: "pnlAmount", type: "uint64" },
      { name: "isProfit", type: "bool" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "transferOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
  },
  {
    name: "PositionSettled",
    type: "event",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "pnlAmount", type: "uint64", indexed: false },
      { name: "isProfit", type: "bool", indexed: false },
    ],
  },
  {
    name: "PoolFunded",
    type: "event",
    inputs: [
      { name: "funder", type: "address", indexed: true },
      { name: "amount", type: "uint64", indexed: false },
    ],
  },
  {
    name: "PoolWithdrawn",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint64", indexed: false },
    ],
  },
] as const;
