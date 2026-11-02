# CONTEXT.md — DocChain: Tamper-Evident Document Issuance & Verification DApp

## 1. What the project is

DocChain is a small decentralized application (DApp) that lets **authorized issuers** (a university, a company, a government office) register a cryptographic fingerprint (SHA-256 hash) of a document on a blockchain test network, and lets **anyone** later check whether a copy of a document:

1. Matches exactly what the issuer registered (not altered by a single byte),
2. Was registered by a known, authorized issuer,
3. Has not been revoked by that issuer.

The actual document is **never uploaded to the blockchain**. Only the 32-byte hash, the issuer address, the timestamp, and a revocation flag are stored on-chain. The verifier's file never leaves their browser.

This is a proof-of-concept. It is not meant to be production-ready. The goal is to prove that the concept works end to end on a public test network within the time available.

### One-sentence pitch
"Upload any certificate or document and instantly confirm, on a public blockchain, whether it was really issued by who it claims and has not been changed or revoked."

### Scope boundaries (what is IN)
- Solidity smart contract with issuer whitelist, issue, revoke, and verify functions.
- React + Tailwind frontend with wallet connection (MetaMask).
- Hashing done in the browser with the Web Crypto API.
- Two main user flows: Issue (authorized issuers) and Verify (anyone, wallet optional).
- Recent issuance activity feed read from contract events.
- Deployment to the Sepolia test network.
- README with deployment steps, run steps, contract address, network, and screenshots.

### Scope boundaries (what is OUT)
- No backend server, no database, no file storage (IPFS etc.).
- No identity verification of the issuer beyond the owner's whitelist.
- No user accounts, no login system apart from the wallet.
- No mainnet deployment. No real money. No token.
- No OCR, no PDF parsing, no AI analysis of document content.
- No encryption of documents, no zero-knowledge proofs.

## 2. Modules and sub-modules

### Module A — Smart contract (`contracts/DocChainRegistry.sol`)
- **A1 Access control**: owner set at deployment. Owner can add or remove issuers.
- **A2 Issuance**: an authorized issuer registers a `bytes32` document hash once. Duplicate hashes are rejected.
- **A3 Revocation**: only the issuer who registered a hash can revoke it. Revocation is permanent.
- **A4 Verification**: a view function returns the record for a hash (exists, revoked, issuer, issuedAt).
- **A5 Events**: `IssuerAdded`, `IssuerRemoved`, `DocumentIssued`, `DocumentRevoked` for the activity feed.

### Module B — Blockchain interaction layer (`src/lib/chain.js`)
- **B1 Provider**: read-only `JsonRpcProvider` using `VITE_RPC_URL` for the Verify page, so verification works without a wallet.
- **B2 Wallet provider**: `BrowserProvider(window.ethereum)` for signed transactions.
- **B3 Network guard**: check `chainId` equals Sepolia (`11155111`). If not, request a switch with `wallet_switchEthereumChain`, and if the chain is unknown, add it with `wallet_addEthereumChain`.
- **B4 Contract factory**: returns a `Contract` instance bound to the signer for writes, or the provider for reads.
- **B5 Error mapping**: converts revert reasons and MetaMask error codes (4001 = user rejected, -32002 = request pending) into short human messages.

### Module C — Hashing layer (`src/lib/hash.js`)
- **C1 File to hash**: reads a `File` with `file.arrayBuffer()` and computes SHA-256 with `crypto.subtle.digest("SHA-256", buffer)`.
- **C2 Format**: converts the digest to a lowercase hex string prefixed with `0x`, which is valid `bytes32` for ethers.
- **C3 Size guard**: rejects files above 25 MB with a clear message, to keep the browser responsive.

### Module D — Frontend pages and components
- **D1 Layout**: top navigation bar (logo, Verify, Issue, Activity), wallet button on the right.
- **D2 Wallet button**: states are "Connect wallet", "Connecting…", "Wrong network (Switch to Sepolia)", and "0x12…ab" when connected.
- **D3 Verify page**: drag-and-drop file zone, computes hash, calls `verify(hash)`, shows a result card with one of four states:
  - **Verified**: exists, not revoked, shows issuer address, issue date.
  - **Revoked**: exists but revoked, shows revocation status.
  - **Not registered**: hash not on chain. Could be a forgery or an unregistered document. Message must not claim forgery.
  - **Error**: RPC or input problem.
- **D4 Issue page**: connects wallet, checks `isIssuer(address)` (or the public `issuers` mapping) and disables the form for non-issuers with a clear explanation. Authorized issuers drop a file, see the hash preview, and submit `issue(hash)`. Shows transaction pending, confirmed (with Etherscan link), or failed states.
- **D5 Revoke panel** (inside Issue page): enter or drop a file, shows whether it was issued by the connected wallet, and submits `revoke(hash)`.
- **D6 Activity page**: reads the last ~5000 blocks of `DocumentIssued` and `DocumentRevoked` events and lists them newest first. Each row links to Sepolia Etherscan.
- **D7 Shared components**: `FileDropzone`, `HashDisplay` (truncated with copy button), `StatusBadge`, `TxStatus`, `Toast`, `EmptyState`, `LoadingSkeleton`.

### Module E — Middleware / glue logic (`src/lib/`, `src/hooks/`)
Since there is no backend, the "middleware" is the frontend logic layer between UI and chain:
- **E1 `useWallet` hook**: holds account, chainId, connect(), disconnect(), and listens to `accountsChanged` and `chainChanged`.
- **E2 `useContract` hook**: returns read or write contract instances based on wallet state.
- **E3 `useVerify` hook**: input file, produce hash, call verify, return typed result.
- **E4 `useIssue` hook**: check issuer status, call issue, track tx hash, wait for receipt, return state machine (idle, hashing, awaiting-signature, pending, success, error).
- **E5 `useActivity` hook**: query events in block ranges, merge and sort, paginate.
- **E6 Config (`src/config.js`)**: reads `VITE_CONTRACT_ADDRESS`, `VITE_RPC_URL`, `VITE_CHAIN_ID`, `VITE_EXPLORER_URL` from env. Fails loudly if any is missing.

### Module F — Deployment and tooling (`scripts/`, `hardhat.config.js`)
- **F1** Hardhat project with `@nomicfoundation/hardhat-toolbox`.
- **F2** `scripts/deploy.js`: deploys the registry and prints the address.
- **F3** `scripts/addIssuer.js`: owner adds an issuer address (used for demo).
- **F4** `test/DocChainRegistry.test.js`: unit tests for every rule.
- **F5** `.env.example` for both root (deployer key, Sepolia RPC) and `frontend/` (public values only).

## 3. Smart contract rules (authoritative)

| Function | Who can call | Rule |
|---|---|---|
| `addIssuer(address)` | owner | Address must be non-zero. Emits `IssuerAdded`. |
| `removeIssuer(address)` | owner | Does not delete existing records. Emits `IssuerRemoved`. |
| `issue(bytes32 docHash)` | authorized issuer | `docHash != 0`. Hash must not already exist. Stores issuer and block timestamp. Emits `DocumentIssued`. |
| `revoke(bytes32 docHash)` | original issuer of that hash | Record must exist and not be revoked. Sets `revokedAt`. Emits `DocumentRevoked`. |
| `verify(bytes32 docHash)` | anyone (view) | Returns `(exists, revoked, issuer, issuedAt)`. Never reverts for unknown hashes. |
| `isIssuer(address)` | anyone (view) | Returns whether address is whitelisted. |

Record struct: `{ bool exists; address issuer; uint64 issuedAt; uint64 revokedAt; }` where `revokedAt == 0` means not revoked.

## 4. Frontend look and feel

### Design direction
Trustworthy, calm, and institutional, but not dull. Think "modern government digital service meets fintech". Clean white and slate surfaces, one confident accent color, generous whitespace, clear status colors. No crypto clichés (no neon, no gradients on every card, no glowing borders).

### Color tokens (Tailwind)
- Background: `slate-50`. Surface cards: `white` with `ring-1 ring-slate-200`.
- Primary accent: `indigo-600` (hover `indigo-700`), used for primary buttons and active nav.
- Verified: `emerald-600` on `emerald-50` background.
- Revoked: `rose-600` on `rose-50`.
- Not registered: `amber-600` on `amber-50`. Neutral wording, never "forged".
- Text: `slate-900` headings, `slate-600` body, `slate-500` meta.

### Typography
- Font: Inter (via Google Fonts or `@fontsource/inter`), fallback `system-ui, sans-serif`.
- Page title `text-3xl font-semibold tracking-tight`. Section title `text-lg font-semibold`. Body `text-sm` or `text-base`. Hashes and addresses use `font-mono text-sm`.

### Layout and spacing
- Max content width `max-w-5xl mx-auto px-4 sm:px-6`.
- Cards `rounded-2xl p-6 shadow-sm`. Consistent `gap-6` between sections.
- Navbar sticky, `h-16`, `backdrop-blur` with `bg-white/80`.

### Responsiveness
- Mobile first. Navigation collapses to a horizontal scroll row under 640px.
- Two-column layout on Issue page from `lg:` upward; single column below.

### States and feedback (must exist)
- Every async action has: idle, loading (spinner or skeleton), success (toast plus result), error (inline message in plain language).
- Transactions show pending state with the tx hash link to Etherscan.
- Empty state on Activity page when no events are found.
- Buttons disabled while a request is in flight, with `aria-busy`.

### Accessibility
- All inputs have labels. Focus rings visible (`focus-visible:ring-2`).
- Color is never the only status signal: each status badge has an icon and text.
- Contrast at least WCAG AA for body text.

### Production-ready design goals (target design, not all required for the demo)
- Consistent component library in `src/components/`.
- Dark mode via Tailwind `dark:` variants (optional, only if time allows).
- Clear onboarding hint: "You need MetaMask and free Sepolia test ETH. Get it from a faucet."
- Plain-language explainer panel on Verify page: what a "match" proves and what it does not prove.

## 5. Data flow (end to end)

Issue flow:
1. Issuer connects wallet → app checks network → app checks `isIssuer`.
2. Issuer drops file → browser computes SHA-256 → hash shown.
3. Issuer clicks "Register" → MetaMask asks to sign `issue(hash)` → tx sent → app waits for receipt.
4. On success, app shows Etherscan link and adds item to Activity feed.

Verify flow:
1. Verifier drops file → browser computes SHA-256 locally.
2. App calls `verify(hash)` via read-only provider (no wallet needed).
3. App renders one of the four result states.

## 6. Non-functional requirements
- Works on latest Chrome and Firefox with MetaMask.
- Verify page works without a wallet.
- No private keys or secret values in frontend code or repo.
- Build succeeds with `npm run build` with zero errors.
- Contract tests all pass with `npx hardhat test`.
