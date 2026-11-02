# TODO.md — Live Task Tracker for DocChain

Reference files (read these first, in this order):
1. PROJECT.md — why the project exists and its limits
2. CONTEXT.md — what each module must do, the contract rules, the UI design
3. PLAN.md — the phases and time boxes
4. AGENT.md — the rules you must follow

Deadline: **today, 2 November 2026, 19:00.**
Session start time: 2026-11-02 (Codex session)

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

---

## In progress

- [~] Phase 0 — Setup
  - Started: 2026-11-02
  - Current step: local project created and pushed to GitHub; dependency install is blocked in this environment

## Next

### Phase 0 — Setup (20 min)
- [x] Create the local project structure and connect the GitHub remote on `main`
- [x] Trace blank frontend screen: added a React error boundary, static loading fallback, dedicated hooks, and completed revoke/activity UI paths
- [!] Root: install Hardhat dependencies and compile — Error: `npm install` did not complete and no `node_modules/` or `package-lock.json` was created — Tried: sandboxed and approved network installs with retries disabled — Needs: npm registry access in the execution environment
- [!] Frontend: install Vite/React dependencies and build — Error: blocked by the same npm registry access issue — Tried: approved network install — Needs: npm registry access in the execution environment
- [ ] Create dummy test wallet in MetaMask (separate from any real wallet); copy address
- [ ] Get Sepolia test ETH (need ~0.05); try a second faucet if the first fails
- [ ] Create Alchemy or Infura account; copy Sepolia RPC URL
- [ ] Exit check: `npx hardhat compile` runs; `npm run dev` shows starter page

### Phase 1 — Smart contract (40 min)
- [ ] Write `contracts/DocChainRegistry.sol` per CONTEXT.md section 3 (owner, issuers, records, custom errors, events)
- [ ] Write `test/DocChainRegistry.test.js` covering all 11 rules in PLAN.md Phase 1
- [ ] Run `npx hardhat test` — all green
- [ ] Run `npx hardhat compile` — ABI available in artifacts

### Phase 2 — Deploy to Sepolia (15 min)
- [ ] Create root `.env` (git-ignored) and `.env.example`
- [ ] Add Sepolia network to `hardhat.config.js` (chainId 11155111, read from env)
- [ ] Write `scripts/deploy.js`
- [ ] Deploy to Sepolia; record contract address: ____________________
- [ ] Write `scripts/addIssuer.js`; add dummy wallet as issuer
- [ ] Verify on Etherscan (time box 5 min; skip if it fails)

### Phase 3 — Frontend: wallet and chain (50 min)
- [ ] `frontend/.env.example` with the four VITE_ variables
- [ ] Copy ABI `abi` field into `frontend/src/abi/DocChainRegistry.json`
- [ ] `src/config.js` with env validation
- [ ] `src/lib/chain.js` (read provider, browser provider, network guard, contract factory, error mapping)
- [ ] `src/hooks/useWallet.js` (connect, disconnect, account and chain listeners; silent restore with `eth_accounts`)
- [ ] `src/hooks/useContract.js`
- [ ] Navbar with four wallet button states
- [ ] Routes: `/` Verify, `/issue`, `/activity`
- [ ] Smoke test: connect, switch to Sepolia, address displayed

### Phase 4A — Hashing (10 min)
- [ ] `src/lib/hash.js` (SHA-256 via Web Crypto, `0x` hex, 25 MB size guard)
- [ ] `FileDropzone` component
- [ ] `HashDisplay` component with copy button

### Phase 4B — Verify page (20 min)
- [ ] `useVerify` hook
- [ ] Four result states with `StatusBadge` (Verified, Revoked, Not registered, Error)
- [ ] Issuer address and issue date shown when relevant
- [ ] Explainer box: what a match proves and what it does not
- [ ] Works with no wallet connected

### Phase 4C — Issue page (25 min)
- [ ] `useIssue` hook with state machine (idle, hashing, awaiting-signature, pending, success, error)
- [ ] Non-issuer state: form disabled with explanation
- [ ] Issuer state: hash file, call `issue(hash)`, show `TxStatus` with Etherscan link
- [ ] Handle "already issued" with a clear message
- [ ] Revoke panel: revoke only hashes issued by the connected wallet

### Phase 4D — Activity page (5 min)
- [ ] `useActivity` hook (last 5000 blocks, merged and sorted)
- [ ] List with `EmptyState` and `LoadingSkeleton`
- [ ] End-to-end check: issue → Verified → revoke → Revoked → both show in Activity

### Phase 5 — UI polish (25 min)
- [ ] Apply design tokens from CONTEXT.md section 4
- [ ] Inter font
- [ ] Toasts, skeletons, empty states
- [ ] Check 375px mobile and 1440px desktop; no horizontal overflow
- [ ] Keyboard focus visible on all controls
- [ ] Page title "DocChain" and favicon

### Phase 6 — Documentation and submission (30 min)
- [ ] README.md with all sections (description, features, tech stack, structure, deploy steps, run steps, contract address and network, screenshots, limitations)
- [ ] Screenshots saved to `docs/screenshots/` (Verify result, Issue page at minimum)
- [ ] Final: `npx hardhat test` passes; `npm run build` passes; `git status` shows no `.env`
- [ ] Commit and push; repo is public; README renders on GitHub

### Phase 7 — Buffer
- [ ] Full demo on a fresh browser profile
- [ ] Fix visible bugs only; no new features

## Blocked

- [!] Dependency verification — Error: `npm install` remains running without output and creates no install artifacts — Tried: sandboxed install, approved install, timeout/retry-limited install — Needs: network access to npm registry, then run `npm install`, `npm test`, and `npm run build`.

Format for a blocked item:
- [!] <task> — Error: <exact message> — Tried: <what you did> — Needs: <what you need from the user>

## Done

(none yet)

Format for a done item:
- [x] <task> — <one line of verification, e.g. "11/11 tests pass" or "tx 0x… confirmed">

## Decisions

Record every spec ambiguity here with the choice made and the reason.
- Build and document all offline/local functionality first because no repository URL, Sepolia RPC URL, deployer key, or contract address was supplied. README will use an explicit pending-deployment placeholder, never a fake address.

## Suggested later (do not implement now)

- Salted hashes (random nonce per document) for stronger privacy
- Batch issuance for multiple documents
- Verifiable-credential or PDF-signature integration
- Mainnet deployment and audit
- Dark mode
- Admin page for managing issuers in the UI

## Cut order if time runs short

1. Simplify Phase 5 to the essentials (fonts and empty states only).
2. Reduce Phase 4D to a plain list of `DocumentIssued` events.
3. Reduce the revoke panel to one button with a confirmation step.
4. Never cut: contract, tests, deployment, Verify and Issue flows, README, screenshots, GitHub push.
