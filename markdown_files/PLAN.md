# PLAN.md — Build Plan for DocChain

Deadline: **Today, 2 November 2026, 19:00 local time.**
Available time when planning started: about **3 hours 30 minutes**.
Rule: each phase has a hard time box. If a phase overruns by more than 15 minutes, drop the lowest-priority item listed for that phase and move on. Never skip the README, deployment, or screenshots.

---

## Phase 0 — Setup (20 min)

Goal: working empty projects for contracts and frontend, and accounts ready.

Tasks:
1. Create GitHub repo `docchain-dapp` (public). Add `.gitignore` for `node_modules`, `.env`, `artifacts`, `cache`, `dist`, `coverage`.
2. Root project: `npm init -y`, install `hardhat`, `@nomicfoundation/hardhat-toolbox`, `dotenv`. Run `npx hardhat init` (choose JavaScript project). Pin versions in `package.json`.
3. Frontend: `npm create vite@latest frontend -- --template react`. Install `ethers@^6`, `tailwindcss@^3`, `postcss`, `autoprefixer`, `react-router-dom`, `lucide-react`. Run `npx tailwindcss init -p`.
4. Wallet setup: install MetaMask, create a dummy wallet (a separate test account, never a wallet holding real funds). Copy its address.
5. Get Sepolia test ETH from a public faucet (for example Google Cloud Web3 faucet or Alchemy faucet). Need about 0.05 ETH. If the faucet fails, try a second faucet immediately.
6. Create Alchemy or Infura free account, get a Sepolia RPC URL.

Exit criteria: `npx hardhat compile` runs; `npm run dev` shows the Vite starter page; wallet shows a positive Sepolia balance.

---

## Phase 1 — Smart contract (40 min)

Goal: `DocChainRegistry.sol` implemented exactly per CONTEXT.md section 3, with tests.

Tasks:
1. Write `contracts/DocChainRegistry.sol` with pragma `^0.8.20`.
   - `owner` set in constructor.
   - `mapping(address => bool) public issuers`.
   - `struct Record { bool exists; address issuer; uint64 issuedAt; uint64 revokedAt; }`.
   - `mapping(bytes32 => Record) private records`.
   - Functions and events as in CONTEXT.md section 3.
   - Modifiers `onlyOwner`, `onlyIssuer`.
   - Custom errors (cheaper than strings): `NotOwner`, `NotIssuer`, `ZeroHash`, `AlreadyIssued`, `NotIssuedByCaller`, `NotFound`, `AlreadyRevoked`, `ZeroAddress`.
2. Write `test/DocChainRegistry.test.js` covering:
   - Owner can add and remove issuers.
   - Non-owner cannot add issuers.
   - Authorized issuer can issue a hash; event emitted; `verify` returns correct data.
   - Non-issuer cannot issue.
   - Zero hash rejected.
   - Duplicate hash rejected.
   - Original issuer can revoke; `verify` shows `revoked = true`.
   - Different issuer cannot revoke.
   - Revoking twice is rejected.
   - `verify` on unknown hash returns `exists = false` and does not revert.
   - Removing an issuer does not invalidate their existing records.
3. Run `npx hardhat test`. All tests must pass.
4. Run `npx hardhat compile`. Confirm ABI available at `artifacts/contracts/DocChainRegistry.sol/DocChainRegistry.json`.

Exit criteria: all tests green.

Priority if running late: items 2a–2d and 2h are mandatory. Others can be shortened.

---

## Phase 2 — Deploy to Sepolia (15 min)

Goal: live contract on Sepolia with a known address and at least one issuer.

Tasks:
1. Create root `.env` (never committed) with `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` (dummy test wallet only). Add `.env.example` with empty values.
2. Add Sepolia network to `hardhat.config.js` with `chainId: 11155111`, reading from env.
3. Write `scripts/deploy.js` that deploys and logs the address.
4. Deploy: `npx hardhat run scripts/deploy.js --network sepolia`. Save the address.
5. Write `scripts/addIssuer.js` that takes issuer address as argument (or env var) and calls `addIssuer`. Run it for the dummy wallet address so the issuer flow can be demoed.
6. Verify the contract on Etherscan: `npx hardhat verify --network sepolia <address>`. If verification fails, do not spend more than 5 minutes; continue.
7. Record address, network, and Etherscan link in a scratch note for README.

Exit criteria: address visible on sepolia.etherscan.io; `isIssuer` returns true for demo issuer.

---

## Phase 3 — Frontend core: wallet and chain (50 min)

Goal: app connects to MetaMask, checks network, reads and writes the contract.

Tasks:
1. `frontend/.env.example` with `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`, `VITE_CHAIN_ID=11155111`, `VITE_EXPLORER_URL=https://sepolia.etherscan.io`.
2. Copy ABI JSON into `frontend/src/abi/DocChainRegistry.json` (read from root artifacts; copy the `abi` field only).
3. Implement `src/config.js` (env validation).
4. Implement `src/lib/chain.js`: read provider, browser provider, network guard, contract factory, error mapping.
5. Implement `src/hooks/useWallet.js` with connect, disconnect, account and chain listeners.
6. Implement `src/hooks/useContract.js`.
7. Build `Navbar` with wallet button (all four states from CONTEXT.md D2).
8. Set up routes: `/` (Verify), `/issue`, `/activity`. Use `react-router-dom`.
9. Smoke test: connect wallet, switch network, see address shown.

Exit criteria: wallet connects, wrong-network state shows, switching to Sepolia works.

---

## Phase 4 — Core features (60 min)

Goal: both main user flows work end to end on Sepolia.

### 4A — Hashing (10 min)
1. Implement `src/lib/hash.js` (SHA-256 via Web Crypto, hex with `0x`, size guard).
2. Implement `FileDropzone` component with drag-and-drop and click-to-select.
3. Show hash with `HashDisplay` component.

### 4B — Verify page (20 min)
1. Implement `useVerify` hook.
2. Render the four result states (Verified, Revoked, Not registered, Error) using `StatusBadge`.
3. Show issuer address and issue date when relevant. Format date with `Intl.DateTimeFormat`.
4. Add an explainer box: what a match proves, what it does not.
5. Confirm it works without a wallet using the read-only provider.

### 4C — Issue page (25 min)
1. Implement `useIssue` hook with state machine (idle, hashing, awaiting-signature, pending, success, error).
2. Non-issuer state: disable form, explain how to get issuer access.
3. Issuer state: hash file, call `issue(hash)`, show `TxStatus` with Etherscan link, then success toast.
4. Handle "already issued" revert with a clear message that shows the existing record.
5. Implement revoke panel: connected issuer can revoke only hashes they issued.

### 4D — Activity page (5 min)
1. Implement `useActivity` hook: query `DocumentIssued` and `DocumentRevoked` for the last 5000 blocks, merge, sort newest first.
2. Render list with `EmptyState` and `LoadingSkeleton`.

Exit criteria: issue a real test document on Sepolia, verify it on the Verify page as Verified, revoke it, verify again as Revoked, and see both events in Activity.

Priority if running late: 4D can be a simple list of only `DocumentIssued`. Revoke panel can be shortened to one button with a text confirmation.

---

## Phase 5 — UI polish (25 min)

Goal: the app looks finished and feels responsive.

Tasks:
1. Apply design tokens from CONTEXT.md section 4 across all pages.
2. Add Inter font and consistent typography.
3. Add loading skeletons, toasts, and empty states.
4. Check mobile width (375px) and desktop width (1440px). Fix overflow.
5. Check keyboard focus on all buttons and inputs.
6. Add favicon and page title "DocChain".

Exit criteria: no visual overflow on mobile, all states visible.

---

## Phase 6 — Documentation and submission (30 min)

Goal: GitHub repo meets every guideline item.

Tasks:
1. Write `README.md` with these sections, in this order:
   - Project description (what problem, what the DApp does)
   - Features (bullet list)
   - Tech stack
   - Project structure (short tree)
   - Steps to deploy the smart contract (install, env setup, compile, test, deploy, addIssuer, verify)
   - Steps to run the frontend (install, env setup, `npm run dev`, build)
   - Contract address and test network used (Sepolia, chainId 11155111, Etherscan link)
   - Screenshots (at least 1: Verify result, Issue page; add 2–3 if time allows) stored in `docs/screenshots/`
   - Limitations and future work (short)
2. Take screenshots with MetaMask connected on Sepolia.
3. Final check: `npx hardhat test` passes, `npm run build` passes, `.env` not in git (`git status`).
4. Commit and push. Confirm the repo is public and README renders on GitHub.

Exit criteria: repo URL opens, README renders, screenshots visible, contract address listed.

---

## Phase 7 — Buffer and final review (remaining time)

- Re-run the full demo flow once on a fresh browser profile.
- Fix any visible bug.
- Do not add new features in this phase.

---

## Time budget summary

| Phase | Time box | Cumulative |
|---|---|---|
| 0 Setup | 20 min | 0:20 |
| 1 Contract | 40 min | 1:00 |
| 2 Deploy | 15 min | 1:15 |
| 3 Wallet and chain | 50 min | 2:05 |
| 4 Core features | 60 min | 3:05 |
| 5 UI polish | 25 min | 3:30 |
| 6 Docs and submit | 30 min | 4:00 |

The total exceeds 3.5 hours, so the **cut order** when time is short is: Phase 5 polish is reduced to the essentials first, then 4D is simplified, then the revoke panel is simplified. Phases 0–3, 4A–4C, and 6 are never cut.
