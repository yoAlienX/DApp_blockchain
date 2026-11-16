# DocChain — current completion tracker

Updated: **7 November 2026** (Asia/Kolkata).
Original planning deadline: **2 November 2026, 19:00**; historical, not the current submission deadline.
Current submission deadline: **not provided**.

Reference: `PROJECT.md`, `CONTEXT.md`, `PLAN.md`, and `AGENT.md`. The original phased plan is retained as background; this file reflects the verified implementation rather than the old installation blocker.

## In progress

- No remaining local implementation task. Public deployment and submission evidence need user configuration; see Blocked and Next.

## Done

- [x] Existing dependency installation recovered and version ranges stabilized; clean `npm ci` installs succeed at root and frontend. Both lockfiles retained. Node 24 recorded in `.nvmrc` and CI.
- [x] Existing Solidity rules preserved; no contract-source/API changes. Full generated ABI now includes owner/issuer getters and is checked against the compiled artifact.
- [x] Contract access control, timestamps, event arguments, duplicates, removed-issuer behavior, revocation permanence, and altered files verified: **17 Hardhat tests pass**.
- [x] Shared wallet context replaces independent navbar/page wallet state; silent restore, explicit connect, local disconnect, account changes, network changes, and add/switch network covered by browser tests.
- [x] Public configuration validated without startup crashes; explicit setup notice; read RPC network/contract-code checks; write-time network/account/permission checks.
- [x] Browser-local hashing, 25 MB guard, exact-byte behavior, safe error mapping, file-read failures, and adaptive event pagination covered by **9 helper tests**.
- [x] Issue/revoke transaction states separated, pending explorer links retained, duplicate record displayed, forms locked during requests, and permanent revocation acknowledgement required.
- [x] Removed issuers can revoke their own existing records, matching the contract; ownership and current revocation state checked again before signing.
- [x] Public Verify retains issuer/date on revoked records, preserves fingerprints after RPC errors, and supports retry. A missing record is not described as forgery.
- [x] Activity scans up to the latest 5,000 blocks in bounded/adaptive ranges, orders same-block events, supports refresh/pagination, and does not label failed RPC requests as empty history.
- [x] Responsive three-page UI, active navigation, focus styles, labeled inputs, secure clipboard error handling, favicon, privacy/trust explanation, and mobile overflow checks.
- [x] Production bundle split into React/Ethereum/page chunks; build succeeds without size warnings. SPA hosting fallbacks included.
- [x] **10 Playwright tests pass**, including actual local-EVM issue → verify → revoke → activity, wallet-free reads, denied signatures, pending confirmations, changed wallet/network, mobile layouts, and production-preview setup rendering.
- [x] Actual unconfigured UI screenshots captured and visually inspected. They are explicitly not public Sepolia evidence.
- [x] Deployment preflight, safe error reporting, public deployment manifests, idempotent issuer authorization, frontend/deployment consistency check, and ABI synchronization scripts implemented.
- [x] README rewritten; detailed `docs/SETUP.md`, `docs/SUBMISSION.md`, and `docs/VERIFICATION.md` added with requirements, troubleshooting, hosting, demo script, and evidence worksheet.
- [x] Synthetic original/altered demo files and exact fingerprints supplied. Git attributes preserve their original bytes.
- [x] Local `npm run check`, browser tests, `git diff --check`, environment ignore/tracking checks, and npm dependency audits completed. Root development-tooling advisories are disclosed, not hidden.
- [x] GitHub CI workflow added; remote CI execution remains unverified. No commit, push, branch creation, or hosting/deployment action performed.

## Blocked

- [!] Sepolia preflight/deployment — exact result: `Set SEPOLIA_RPC_URL to an HTTPS Sepolia endpoint in the root .env.` Root `.env` values remain empty; frontend `.env` is absent. Asked the user whether a deployment, funded test wallet, and RPC provider already exist. Needs: local configuration, testnet funds, and decision to reuse or deploy. **Never request the private key in chat.**
- [!] Public hosting — no hosting account/project or production URL selected. Detailed static-host setup supplied; no external hosting action authorized/executed.
- [!] Final submission evidence — no real deployment/issue/revoke transaction hashes, wallet-free live result, or live screenshots available. Local EVM transactions and test addresses must not fill this gap.
- [!] Repository submission/CI — no recognized origin URL confirmed in this session; repository URL/access and course submission instructions still need confirmation.

## Next — user-assisted completion

1. Confirm the actual submission deadline and whether an existing DocChain Sepolia deployment should be reused.
2. Follow `docs/SETUP.md`: create/fund a dedicated test-only wallet and configure root RPC/key values locally.
3. Run preflight; deploy only if necessary; record the real manifest/address/transaction.
4. Authorize the actual MetaMask issuer and configure the frontend’s four public values.
5. Run `npm run check-deployment`; validate real MetaMask/CORS/RPC behavior.
6. Host the frontend over HTTPS and test direct route refreshes.
7. Follow `docs/SUBMISSION.md` to record the full real Sepolia demo, take live screenshots, and complete the README deployment table.
8. Review source/lockfiles/public evidence and repository access before manually committing/pushing/submitting.

## Decisions

- Keep Solidity 0.8.20, Hardhat 2/toolbox, ethers v6, React/Vite/Tailwind 3, and the Sepolia-only application. No backend, database, IPFS, authentication system, AI dependency, token, or admin page.
- Add `@playwright/test` as a development-only dependency to catch real-browser integration regressions and capture genuine UI screenshots; no extra unit-test framework is needed.
- Isolate test EVM configuration in `e2e/hardhat.config.cjs`; it uses Sepolia’s chain ID only to exercise guards. No local chain is offered as a user-facing deployment option or represented as public Sepolia.
- Keep removed-issuer revocation consistent with the contract. Current whitelist membership is not an extra requirement for revoking that issuer’s old records.
- Retain root tooling’s known audit findings rather than applying a breaking Hardhat/toolbox migration with `npm audit fix --force`. No production-security claim is made.
- Keep all environment secrets untouched and all live-deployment fields explicitly pending. No fake addresses/transactions or generated mockups in submission evidence.
- Updated the historical deadline wording rather than assuming the old “today” still applies.

## Suggested later (not implemented)

- Audited owner/key recovery and issuer identity governance.
- Salted records for stronger privacy, batch issuance, and verifiable credentials.
- Carefully tested tooling migration addressing development dependency advisories.
- Real Firefox/MetaMask coverage and robust RPC failover for a production design.
