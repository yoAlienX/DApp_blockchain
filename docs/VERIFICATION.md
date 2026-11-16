# Verification record — 7 November 2026

## Completed local verification

Environment: Node 24.21.0, npm 11.19.0, Hardhat 2.29.1, Solidity 0.8.20, Vite 8.3.5, and installed Google Chrome on Linux.

| Check | Result |
| --- | --- |
| Clean installs from both lockfiles (`npm ci`) | Passed; contract/helper/build checks repeated afterward |
| Solidity compile and full ABI synchronization | Passed |
| Hardhat tests | 17 passed |
| Helper tests (Node built-in test runner) | 9 passed; also executed directly to inspect each result |
| Playwright browser suite | 10 passed |
| Vite production build | Passed without chunk-size warnings |
| JavaScript syntax, CI YAML, local Markdown links, whitespace | Passed; no broken local documentation links |
| Desktop (1440 px) / mobile (375 px) | Browser tests confirm no horizontal overflow in tested states |
| Unconfigured UI screenshots | Real browser captures, explicitly labeled as setup state |
| Root/frontend `.env` tracking | Neither secret environment file is tracked |
| Public-network preflight | Correctly stops: `Set SEPOLIA_RPC_URL to an HTTPS Sepolia endpoint in the root .env.` |

The browser suite deploys the unchanged Solidity contract into an isolated Hardhat EVM. Browser RPC requests are routed to that EVM and issuer calls use a test EIP-1193 adapter. It checks wallet-free verification, full issue/verify/revoke/activity flow, removed-issuer revocation, wallet/network changes, pending receipts, rejected signatures, duplicates, error retries, disabled dropzones, invalid hashes, mobile layout, and setup-state rendering. It is **not Sepolia evidence**, and the adapter does not test real MetaMask prompts.

The setup browser project exercises the production build/preview with intentionally empty public configuration. The configured local-EVM project exercises Vite development mode. Hosted production RPC and wallet calls still require the live acceptance checks.

## Dependency audit

Executed npm registry audits during this session:

- `npm --prefix frontend audit --omit=dev --json`: **0 reported vulnerabilities** in shipped frontend dependencies at the time checked. This is not proof of overall application security.
- `npm audit --json` at the root: **49 development-tooling findings** (19 low, 11 moderate, 19 high, 0 critical), including transitive Hardhat/toolbox dependencies. Several suggested fixes require a major Hardhat/toolbox migration.

These root tooling dependencies are not bundled into the static frontend. Do not run untrusted contracts/tests or use real-asset wallets in this environment. No `npm audit fix --force` was run: silently replacing the requested Hardhat 2/toolbox stack before submission could break the project. A tested tooling migration is future maintenance, not a claim of a clean security audit. Re-run audits before any production use; advisory databases change.

## Execution constraints encountered

- Sandboxed Hardhat initially could not create its global cache (`EROFS`). The contract tests succeeded after an approved run with cache/compiler-download access.
- Sandboxed npm/browser-server operations were blocked by DNS/process/socket restrictions. Dependency auditing and browser tests succeeded with approved access.
- No source changes were made to `contracts/DocChainRegistry.sol`. The frontend now uses the complete ABI generated from the compiled source, including public getters.
- An initial browser assertion targeted the outgoing page’s file input during navigation. The test now scopes to the Verify region; the corrected suite passed.

## Not yet verified

- Public Sepolia deployment, issuer authorization, gas balances, or explorer source verification.
- Live MetaMask signing and browser behavior on a real public RPC endpoint.
- Hosted origin/CORS/rate limits, direct route handling on an actual hosting provider, or Firefox/MetaMask compatibility.
- A GitHub-hosted CI run (workflow added, but not pushed/executed remotely).
- Real Verified/Revoked screenshots and final submission evidence.

Keep these items pending until completed using `SETUP.md` and `SUBMISSION.md`. Do not relabel local transactions or setup screenshots as a public-testnet demonstration.
