# ShadowPool DEX: Confidential Decentralized Exchange

ShadowPool is a next-generation decentralized exchange (DEX) built on the Fhenix Network, leveraging Fully Homomorphic Encryption (FHE) to enable confidential trading and liquidity provision. By encrypting transaction parameters and state variables, ShadowPool ensures that trade orders, pool balances, and user positions remain hidden from public observers, protecting traders from front-running and MEV extraction.

## Table of Contents
1. [Platform Overview and Features](#platform-overview-and-features)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Blockchain Integration](#blockchain-integration)
5. [Smart Contract Components](#smart-contract-components)
6. [Fhenix Integration Details](#fhenix-integration-details)
7. [Getting Started](#getting-started)

## Platform Overview and Features

ShadowPool operates as a hybrid order-matching and automated market-making (AMM) protocol designed specifically for confidential assets.

| Functionality | Description |
|---|---|
| **Confidential Trading** | Users can submit encrypted buy and sell orders. Trade amounts, prices, and side (buy/sell) are processed as encrypted integers, ensuring absolute privacy. |
| **Dark Pool Liquidity** | Liquidity providers can deposit assets without revealing the total pool depth to the open market, preventing liquidity analysis and targeted attacks. |
| **Encrypted Order Matching** | The matching engine evaluates orders homomorphically, executing trades without decrypting the underlying order parameters during the evaluation phase. |
| **Private Settlement** | Positions are settled, and margins/profits are returned using Encrypted USDC (EUSDC), maintaining privacy throughout the entire lifecycle of a trade. |
| **Owner Operations** | Certain administrative tasks, such as off-chain oracle integration and settlement calculations based on decrypted outcomes, are restricted to the contract owner. |

## Technology Stack

The ShadowPool platform is built utilizing a modern Web3 stack tailored for confidential computing:

*   **Smart Contracts:** Solidity `^0.8.24`
*   **Confidentiality Layer:** Fhenix Network (FHE Coprocessor)
*   **FHE Library:** `@fhenixprotocol/cofhe-contracts` (Provides `euint8`, `euint32`, `euint64` etc., and homomorphic operations)
*   **Development Framework:** Foundry (Forge/Cast)
*   **Frontend Ecosystem:** React/Next.js, Ethers.js / Viem, `fhenix.js` (for client-side encryption/decryption)
*   **Network:** Ethereum Sepolia (Current Testnet Deployment)

## System Architecture

The ShadowPool architecture separates public state interactions from confidential compute operations.

1.  **Client Application:** A web interface integrates `fhenix.js` to construct encrypted payloads (FHE ciphertexts) from user inputs (e.g., trade size).
2.  **RPC/Gateway:** Transactions containing encrypted payloads are broadcasted to the Fhenix RPC endpoint.
3.  **Fhenix Sequencer & FHE Coprocessor:** The network receives the transaction. The FHE Coprocessor performs computations directly on the encrypted data as instructed by the smart contract logic.
4.  **Smart Contracts (`ShadowPool`):** The core logic dictates how encrypted balances are updated, orders are stored, and matches are executed. State updates are recorded on-chain as encrypted values.

## Blockchain Integration

ShadowPool is currently deployed on the **Ethereum Sepolia Testnet** utilizing the Fhenix testnet environment.

*   **Network Interoperability:** EVM-compatible execution environment with specialized FHE precompiles.
*   **Signatures:** Standard ECDSA signatures are used for transaction authorization, while FHE public keys encrypt the payload data.
*   **State Management:** The contract state heavily relies on encrypted variables (e.g., `euint64`). Reading these variables requires explicit decryption requests or sealing mechanisms provided by the Fhenix protocol, depending on the authorization context.

## Smart Contract Components

The protocol is composed of two primary smart contracts:

| Contract | Role | Key Functions |
|---|---|---|
| `EncryptedERC20.sol` | Represents the base currency (EUSDC) for trading and margin. Implements an encrypted standard similar to ERC20, where balances are `euint64`. | `mintTo()`, `transfer()`, `transferFrom()`, `claimFaucet()`, `setMinter()` |
| `ShadowPool.sol` | The core trading engine and liquidity pool. Manages user orders, matches trades, handles margin deposits, and settles positions. | `fundPool()`, `submitOrder()`, `matchOrders()`, `closePosition()`, `settlePosition()` |

### Contract Relationships
*   `ShadowPool` holds authorization (`setMinter`) to mint `EncryptedERC20` tokens. This is critical for settling profitable trades where the return amount exceeds the initial margin, allowing the pool to fulfill payment obligations.

## Fhenix Integration Details

ShadowPool relies on several core features of the Fhenix FHE implementation:

*   **Data Types:** Extensive use of `euint64` (`EncryptedOrder.margin`, `EncryptedOrder.amount`) to store financial values securely.
*   **Homomorphic Operations:** The matching engine (`ShadowPool`) utilizes FHE operations (e.g., addition, subtraction, conditional logic via FHE comparators) to evaluate trade validity and update balances without ever seeing the plaintext numbers.
*   **Sealed Access:** When a user needs to view their balance or order status, `fhenix.js` facilitates a "sealing" process where the contract returns a ciphertext encrypted specifically for the user's public key, ensuring only they can decrypt and view their data.
*   **Operator Decryption:** In the current architecture, the `settlePosition` function relies on the `owner` to provide the plaintext `returnAmount` and `isProfit` boolean based on off-chain calculations. This is an architectural choice made to bypass current limitations in fully on-chain homomorphic profit/loss calculation loops.

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   Foundry Toolkit
*   A wallet with Sepolia ETH

### Build and Test
1. Clone the repository.
2. Install dependencies (Foundry submodules and NPM packages).
3. Compile contracts:
   ```bash
   forge build
   ```
4. Run standard tests:
   ```bash
   forge test
   ```

### Deployment
To deploy the contracts to the Sepolia testnet:

1. Create a `.env` file and define your deployer private key:
   ```env
   PRIVATE_KEY=your_private_key_here
   ```
2. Ensure you have Sepolia ETH to cover gas costs.
3. Run the deployment script:
   ```bash
   forge script script/Deploy.s.sol --rpc-url <YOUR_SEPOLIA_RPC> --broadcast
   ```
   *The deployment script automatically deploys EUSDC, sets up the ShadowPool, authorizes minting, and funds the pool with initial liquidity.*
