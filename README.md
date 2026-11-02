# DocChain

DocChain is a proof-of-concept decentralized application for tamper-evident document issuance and verification. An authorized issuer registers only a document's SHA-256 fingerprint on-chain. Anyone can later upload the exact file and check whether it matches the public Sepolia record, who issued it, and whether it has been revoked. The document itself never leaves the verifier's browser.

## Features

- Solidity registry with owner-managed issuer whitelist.
- Authorized issuers can issue and revoke document hashes.
- Wallet connection through MetaMask and ethers.js v6.
- Browser-side SHA-256 hashing with a 25 MB file-size guard.
- Wallet-free verification through a read-only Sepolia provider.
- Clear verified, revoked, not-registered, loading, and error states.
- Responsive React/Tailwind interface.

## Tech stack

Solidity `^0.8.20`, Hardhat, JavaScript, React, Vite, Tailwind CSS v3, `react-router-dom`, `lucide-react`, and ethers.js v6.

## Project structure

```text
contracts/DocChainRegistry.sol  Smart contract
test/                           Hardhat tests
scripts/                        Deployment and issuer scripts
frontend/src/                   React UI and blockchain interaction layer
```

## Deploy the smart contract

1. Install dependencies:

   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. Copy `.env.example` to `.env` and add a Sepolia RPC URL and a dummy test-wallet private key. Never commit `.env`.

3. Compile and test:

   ```bash
   npm run compile
   npm test
   ```

4. Deploy to Sepolia:

   ```bash
   npm run deploy
   ```

5. Set `CONTRACT_ADDRESS` and `ISSUER_ADDRESS` in `.env`, then add the issuer:

   ```bash
   npm run add-issuer
   ```

6. Verify the contract if desired:

   ```bash
   npx hardhat verify --network sepolia CONTRACT_ADDRESS
   ```

## Run the frontend

Copy `frontend/.env.example` to `frontend/.env`, then set the deployed contract address and a public Sepolia RPC URL:

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Contract address and test network

- Network: Sepolia
- Chain ID: `11155111`
- Contract address: **Pending Sepolia deployment**
- Etherscan: **Pending contract address**

The address and link above must be updated after deployment; no address is invented in this repository.

## Screenshots

Add screenshots from the running application to `docs/screenshots/` before submission. The placeholders below are intentionally not fake screenshots.

![Verify page screenshot placeholder](docs/screenshots/verify-page.png)

![Issue page screenshot placeholder](docs/screenshots/issue-page.png)

## Limitations and future work

This is a proof of concept on a test network. A matching hash proves file integrity relative to the issuer's record, not that the document's contents are truthful. Issuer trust, wallet key management, exact-file sensitivity, public hash permanence, privacy-law questions, and testnet-only operation remain limitations. Future work could include salted hashes, batch issuance, verifiable-credential integration, and audited production deployment.
