# DocChain DApp — Technical & Viva Report

## 1. Project Overview

**DocChain** is a decentralized document issuance and verification application (DApp) built for the **Ethereum Sepolia testnet** (Chain ID `11155111`). It solves the problem of verifying whether a digital document is authentic and unrevoked without uploading the document to a server, database, or blockchain.

- **Core idea:** An authorized issuer computes a cryptographic **SHA-256** fingerprint (`bytes32`) of a file locally in the browser and records that fingerprint on-chain via the `DocChainRegistry` smart contract.
- **Wallet-free verification:** Anyone can select the exact original file on the **Verify** page, recompute its SHA-256 hash locally, and query the smart contract over a public Sepolia RPC to check:
  1. Whether the document fingerprint is registered (`exists`)
  2. Which Ethereum address issued it (`issuer`)
  3. When it was registered (`issuedAt`, from `block.timestamp`)
  4. Whether it has been permanently revoked (`revoked`)

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Smart Contract** | Solidity `^0.8.20` (`contracts/DocChainRegistry.sol`) | On-chain registry storing document records and issuer permissions |
| **Contract Tooling & Testing** | Hardhat `2.29.1`, `@nomicfoundation/hardhat-toolbox` `5.0.0`, Chai | Compilation, ABI extraction, local EVM testing (17 tests), Sepolia deployment |
| **Frontend UI** | React, Vite, Tailwind CSS 3, React Router, `lucide-react` | Responsive 3-page interface: Verify, Issue/Revoke, and Activity |
| **Blockchain Interaction** | `ethers.js` v6 (`JsonRpcProvider`, `BrowserProvider`, `Contract`) | Wallet-free public reads via RPC; MetaMask transaction signing for writes |
| **Client-Side Hashing** | Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`) | Local SHA-256 computation (25 MB limit); file bytes never leave the browser |
| **E2E & Unit Testing** | `node --test`, Playwright | 9 frontend helper unit tests + browser E2E tests against an isolated local EVM |

---

## 3. Smart Contract Architecture (`DocChainRegistry.sol`)

The contract in `contracts/DocChainRegistry.sol` is intentionally minimal, deterministic, and gas-efficient:

### State Variables & Data Structures
- `address public immutable owner`: Set once in the `constructor()` to `msg.sender` (the deployer). Immutable to save gas and prevent unauthorized ownership changes.
- `mapping(address => bool) public issuers`: Whitelist mapping of addresses permitted to issue documents. Note that the `owner` is **not** automatically an issuer and must explicitly call `addIssuer(...)` to authorize an issuer (including itself if desired).
- `struct Record { bool exists; address issuer; uint64 issuedAt; uint64 revokedAt; }`: Stores whether a `bytes32` hash was registered, the original issuer's address, the registration timestamp, and the revocation timestamp (`0` if active).
- `mapping(bytes32 => Record) private records`: Maps each 32-byte SHA-256 document hash to its `Record`.

### Custom Errors & Events
- **Custom Errors** (cheaper than `require` strings): `NotOwner()`, `NotIssuer()`, `ZeroHash()`, `AlreadyIssued()`, `NotIssuedByCaller()`, `NotFound()`, `AlreadyRevoked()`, `ZeroAddress()`.
- **Events** (indexed for efficient off-chain log queries on the Activity page):
  - `IssuerAdded(address indexed issuer)`
  - `IssuerRemoved(address indexed issuer)`
  - `DocumentIssued(bytes32 indexed docHash, address indexed issuer, uint64 issuedAt)`
  - `DocumentRevoked(bytes32 indexed docHash, address indexed issuer, uint64 revokedAt)`

### Functions
1. `addIssuer(address issuer)` / `removeIssuer(address issuer)` (`onlyOwner`): Grants or revokes issuance rights. Rejects `address(0)`. Removing an issuer blocks future issuance, but **does not** invalidate previously issued records and still allows that original issuer to revoke its own past records.
2. `issue(bytes32 docHash)` (`onlyIssuer`): Registers a non-zero `docHash` if it has not already been issued (`!records[docHash].exists`). Records `block.timestamp` and emits `DocumentIssued`.
3. `revoke(bytes32 docHash)`: Permanently marks a registered document as revoked (`revokedAt = uint64(block.timestamp)`). Only the **original** `record.issuer` can revoke it (`NotIssuedByCaller` otherwise), and it cannot be revoked twice (`AlreadyRevoked`) or reissued later.
4. `verify(bytes32 docHash)` (`external view`): Returns `(bool exists, bool revoked, address issuer, uint64 issuedAt)` for any hash with zero gas cost.
5. `isIssuer(address account)` (`external view`): Returns whether an address is currently authorized.

---

## 4. How the Frontend Interacts with the Blockchain

### A. Local Hashing (`frontend/src/lib/hash.js`)
- `hashFile(file)` validates that a file is selected, is at most `25 * 1024 * 1024` bytes (25 MB), and that `globalThis.crypto.subtle` is available (requires HTTPS or `localhost`).
- It reads the file into an `ArrayBuffer` and computes `SHA-256`, formatting the 32-byte digest as a `0x`-prefixed 64-character hex string (`bytes32`).
- Changing even a single byte in the file produces a completely different SHA-256 hash, so tampered files resolve as **Not registered**.

### B. Wallet-Free Reads (`frontend/src/lib/chain.js`)
- `readProvider()` creates an `ethers.JsonRpcProvider` using `VITE_RPC_URL` (from `frontend/.env`).
- `readRegistry()` verifies that the RPC is on Sepolia (`chainId === 11155111n`) and that bytecode exists at `VITE_CONTRACT_ADDRESS` (`getCode !== '0x'`), then returns a read-only `ethers.Contract` instance using the compiled ABI (`frontend/src/abi/DocChainRegistry.json`).
- **Verify** calls `registry.verify(docHash)` and **Activity** queries `DocumentIssued` / `DocumentRevoked` logs over the latest 5,000 blocks. No MetaMask connection is needed for either.

### C. MetaMask Connection & Writes (`frontend/src/hooks/useWallet.js`, `frontend/src/lib/chain.js`)
- `WalletProvider` manages shared MetaMask state (`account`, `chainId`, `wrongNetwork`, `connect`, `disconnect`) and listens for `accountsChanged`, `chainChanged`, and `disconnect` EIP-1193 events.
- `connect()` requests accounts via `eth_requestAccounts` and calls `ensureSepolia()`, which switches MetaMask to Sepolia (`wallet_switchEthereumChain`, or `wallet_addEthereumChain` if error code `4902` occurs).
- Before any write (`issue` or `revoke`), `writableRegistry(expectedAccount)` creates an `ethers.BrowserProvider(window.ethereum)`, checks that the wallet is on Sepolia, gets the `signer`, confirms the active signer address still matches the UI's connected account, and returns `contract(signer)`.
- `waitForTransaction(tx)` waits for 1 confirmation (`tx.wait(1)`) and handles repriced/replaced transactions safely.

---

## 5. Verification & Current Status

- **Automated checks (`npm run check`):**
  - `hardhat compile && node scripts/syncAbi.js`: Compiles `DocChainRegistry.sol` and syncs `frontend/src/abi/DocChainRegistry.json`.
  - `hardhat test`: **17/17 tests passing** (owner/issuer permissions, issue/revoke lifecycle, duplicate/zero-hash guards, removed-issuer behavior, ABI completeness).
  - `node --test frontend/test/*.test.js`: **9/9 tests passing** (SHA-256 hashing, 25 MB limit, error formatting, config validation, activity log pagination).
  - `vite build`: Production bundle builds cleanly.
- **Pending live Sepolia steps (requires your funded MetaMask test wallet & Sepolia RPC URL):**
  1. Fill `.env` (`SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `ISSUER_ADDRESS`).
  2. Run `npm run preflight`, `npm run deploy`, and `npm run add-issuer`.
  3. Fill `frontend/.env` (`VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`, `VITE_CHAIN_ID=11155111`, `VITE_EXPLORER_URL=https://sepolia.etherscan.io`).
  4. Run `npm run check-deployment`, start the frontend (`npm --prefix frontend run dev`), test Issue/Verify/Revoke with MetaMask, and update `README.md` and `docs/SUBMISSION.md` with the live contract address and screenshots.
