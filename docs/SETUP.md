# DocChain setup and deployment runbook

This guide distinguishes **steps you still need to perform** from tests already executed. No Sepolia transaction has been sent by this completion session. Current date: **7 November 2026**; the 2 November deadline in the original planning notes is historical.

## 1. Requirements and cost boundaries

| Requirement | Why it is needed | Needed for |
| --- | --- | --- |
| Node.js 24 and npm | Reproducible installed toolchain; `.nvmrc` specifies 24 | All development |
| Git and the repository | Source, lockfiles, and submission history | Submission |
| Chrome + MetaMask | Wallet connection and transaction approval | Issuer live demo |
| Dedicated test-only wallet | Deployment/owner administration and optionally issuance | Sepolia writes |
| Sepolia test ETH | Gas for deployment, adding an issuer, issue, and revoke | Sepolia writes |
| HTTPS Sepolia RPC endpoint | Hardhat network access and public verification | Live app |
| Static HTTPS hosting | A publicly reachable frontend | Public demonstration |
| Playwright browser | Automated local-EVM browser regressions | Browser tests |

No database, backend, IPFS account, AI API key, OpenAI/Astra token, paid token, or mainnet funds are required. Faucet eligibility and provider limits vary; do not buy test ETH or promise a fixed faucet allocation. A positive balance is necessary but does not guarantee sufficient gas for every operation.

Official starting points (provider interfaces and availability can change):

- Node: <https://nodejs.org/en/download>
- MetaMask: <https://metamask.io/download/>
- Ethereum network/faucet information: <https://ethereum.org/en/developers/docs/networks/>
- Alchemy: <https://www.alchemy.com/>
- Infura: <https://www.infura.io/>
- Vite hosting documentation: <https://vite.dev/guide/static-deploy>
- Playwright browser installation: <https://playwright.dev/docs/browsers>

Use official sites. Never give a faucet, RPC provider, hosting service, or this chat your seed phrase/private key.

## 2. Install and validate the local project

Run commands from the repository root unless stated otherwise:

```bash
node --version
npm --version
npm ci
npm --prefix frontend ci
npm run check
```

Use Node 24; if you use nvm, select the version from `.nvmrc` before installing. Do not replace the lockfiles with random dependency versions. The first Solidity compilation needs access to download the 0.8.20 compiler and a writable Hardhat cache. Compilation also regenerates the frontend ABI; do not hand-edit that JSON.

Expected: Solidity compiles, all contract and helper tests pass, and `frontend/dist/` is generated. These checks do not need `.env` secrets or test ETH.

Browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

On this Linux workstation the test configuration uses installed Google Chrome; otherwise it falls back to Playwright Chromium. CI installs Chromium and OS dependencies. If Linux reports missing browser libraries, use Playwright’s documented `install --with-deps chromium` workflow with your system administrator’s approval.

Ports 4173 and 4174 must be free. Tests start and stop their own Vite servers. The EVM exists only inside the test process. It deliberately reports chain ID 11155111 to exercise the application’s network guards; **it is not connected to Sepolia**. A test adapter replaces wallet prompts. No real wallet or private key is needed. Browser tests capture only unconfigured UI screenshots into `docs/screenshots/`.

## 3. Create the test wallet

1. Install MetaMask from its official site in a browser/profile used only for this demo.
2. Create a separate test wallet. Do not import a personal or funded mainnet wallet.
3. Keep the recovery phrase offline. Do not store it in the repository, screenshots, terminal history, or chat.
4. Enable/show test networks in MetaMask and select **Sepolia**, chain ID **11155111**.
5. Copy the **public account address**. For the smallest demo, the same test-only wallet can deploy the registry and act as issuer. These are logically separate roles; an owner must still authorize itself explicitly.
6. Request test ETH from a Sepolia faucet linked by a trusted provider or Ethereum’s network documentation. Confirm the balance on Sepolia before continuing.
7. Export the test account’s private key locally using MetaMask’s account controls. Put it only into the ignored root `.env`, using a local editor rather than a shell command containing the key. Never paste it into a support message.

If owner and issuer are different wallets, both require their own test ETH for the transactions they send. Only the owner key is needed in root `.env`; issuer transactions are signed in MetaMask.

## 4. Obtain RPC access

1. Create an Ethereum **Sepolia** project/application with your chosen RPC provider.
2. Copy its HTTPS RPC endpoint, not an Ethereum mainnet endpoint or WebSocket URL.
3. Use an endpoint allowed for server-side requests in root `SEPOLIA_RPC_URL`.
4. Use a browser-accessible endpoint in frontend `VITE_RPC_URL`. It can be a separate public/project key with origin restrictions and rate limits appropriate for localhost and your hosted site.
5. Allow the localhost origin printed by Vite and your final HTTPS host where your provider supports origin controls. Check that verification, code reads, and log queries are permitted.

**Every `VITE_` value is exposed in the built JavaScript.** An RPC URL containing a provider project key is not a secret once used in the frontend. Never put account-management tokens, private keys, or privileged provider credentials there. Do not embed HTTP basic-auth credentials in URLs. Frontend and root endpoints may differ but must both point to Sepolia.

## 5. Configure root `.env`

Copy `.env.example` to `.env` **only if `.env` does not already exist**. This workstation already has an empty `.env`; fill it in place. Do not overwrite an existing deployment configuration.

| Variable | Value |
| --- | --- |
| `SEPOLIA_RPC_URL` | Your server-accessible HTTPS Sepolia RPC URL |
| `DEPLOYER_PRIVATE_KEY` | Test-only owner key: `0x` plus 64 hex characters; keep local |
| `ISSUER_ADDRESS` | Public MetaMask address used to issue documents |
| `CONTRACT_ADDRESS` | Leave empty until deployment, or use your existing registry |

Protect the file with owner-only read/write permissions using your OS tools. `.gitignore` excludes `.env` files except examples. Check `git status --short`; never force-add an environment file.

```bash
npm run preflight
```

Expected: Sepolia chain ID, public deployer address, positive test ETH balance, and “Preflight passed. No transaction was sent.” RPC/key values are never printed by the script. If it fails, correct the stated requirement first.

## 6. Deploy or reuse the registry

**If you already have a deployment:** do not redeploy unnecessarily. Confirm it is this contract on Sepolia, set `CONTRACT_ADDRESS`, and confirm that your root key belongs to its immutable owner. The Solidity source/API was not changed in this completion work. Then continue with issuer authorization.

**If you have no deployment:**

```bash
npm run deploy
```

This is a real testnet transaction, authorized by the key in root `.env`. It runs preflight first, deploys the registry, waits for confirmation, and prints only public results. A real-address-specific manifest is saved at `deployments/sepolia-<address>.json` so later deployments do not silently overwrite older manifests.

Record the public address, owner, deployment transaction, and block. Set `CONTRACT_ADDRESS` to the actual returned address. If a timeout occurs after broadcast, inspect the deployment transaction/account on Sepolia Etherscan before retrying; a timeout does not prove failure. Deployment is not idempotent and repeating it creates a different registry.

## 7. Authorize the issuer

With `CONTRACT_ADDRESS` and `ISSUER_ADDRESS` filled:

```bash
npm run add-issuer
```

Expected: either a confirmed issuer-authorization transaction or an “already authorized” message without a new transaction. The command checks Sepolia, contract bytecode, and owner identity. Copy the successful authorization transaction hash into the submission worksheet.

The deployer is not automatically authorized to issue. Use the exact MetaMask account listed in `ISSUER_ADDRESS` for the browser demo. Removing an issuer later does not delete/revoke its existing records; the original issuer can still revoke them.

## 8. Configure and run the frontend

Copy `frontend/.env.example` to `frontend/.env` if it does not exist. Complete all four fields:

| Variable | Required value |
| --- | --- |
| `VITE_CONTRACT_ADDRESS` | The same deployed address as root `CONTRACT_ADDRESS` |
| `VITE_RPC_URL` | Public/browser-accessible HTTPS Sepolia RPC URL |
| `VITE_CHAIN_ID` | `11155111` |
| `VITE_EXPLORER_URL` | `https://sepolia.etherscan.io` |

```bash
npm run check-deployment
npm --prefix frontend run dev
```

Open the URL printed by Vite. The setup notice should disappear. Verify should work in a browser with **no wallet extension**. Issue requires MetaMask. “Connect wallet” requests accounts only on click; already authorized accounts can be silently restored. “Disconnect” clears this app session; revoke the site’s permissions in MetaMask if you also want to remove wallet authorization.

Changing `.env` while Vite is running requires restarting the server. Hosted values are injected during build and require a new deployment. A successful preflight does not validate a browser’s CORS rules; test from the browser too.

## 9. Host the frontend

The simplest deployment is a static HTTPS site. No backend runtime or server-held wallet key is needed.

For a Git-based Vercel or Netlify project:

1. Connect your repository from the hosting dashboard; no hosting action is performed by this repository automatically.
2. Set the project/root/base directory to **`frontend`**.
3. Choose Node **24**, install using `npm ci`, build using `npm run build`, and publish/output **`dist`**.
4. Add only the four public `VITE_` variables. **Do not upload root `.env` or configure `DEPLOYER_PRIVATE_KEY` on the host.**
5. Deploy, then open the resulting HTTPS URL. Update RPC origin restrictions if necessary.
6. Open `/issue` and `/activity` directly and refresh. They must return the app rather than 404. `frontend/vercel.json` provides the Vercel rewrite; `frontend/public/_redirects` is copied into `dist` for Netlify.
7. Verify the same document in an incognito/profile without a wallet. Check browser network errors and mobile width.

For another static host, configure its equivalent SPA fallback to `index.html` for non-asset routes. This build assumes hosting at the domain root, not a repository subpath such as a default GitHub Pages URL. Do not upload `node_modules`, root `.env`, test traces, or the whole source tree as the published site.

Local production preview:

```bash
npm --prefix frontend run build
npm --prefix frontend run preview
```

## 10. Optional contract source verification

Source verification helps reviewers inspect the code. It is not a security audit and is not required for the app’s read/write calls.

On Sepolia Etherscan, open your **actual contract address**, find the contract source verification workflow, and use Solidity **Standard JSON Input**. Copy the `input` object from the matching Hardhat `artifacts/build-info/*.json`, not the entire build-info file. Select the compiler version recorded in that file (Solidity 0.8.20), preserve all compiler settings, and use no constructor arguments (the constructor has none). The SPDX identifier already present in the source is MIT. Explorer account/API requirements may vary.

The repository intentionally does not claim `hardhat verify` is ready: no explorer API credentials are configured. Do not paste unrelated service tokens into the deployer key field.

## 11. Troubleshooting

| Symptom | Check/action |
| --- | --- |
| Setup notice / disabled file input | Fill all frontend values; rebuild/restart. Root `.env` does not configure Vite. |
| RPC is not Sepolia | Change the endpoint, not the application chain ID. Mainnet is intentionally unsupported. |
| No contract exists at address | Confirm Sepolia, copied address, deployment receipt, and RPC network. |
| Wallet unauthorized | Connect the account in `ISSUER_ADDRESS`; run `add-issuer` with the owner key; click Refresh issuer access. |
| Cannot revoke another wallet’s document | Only its original issuer can revoke, not even the owner on its behalf. |
| “Transaction cancelled in wallet” | The user rejected approval. Retry when ready; no successful issuance is assumed. |
| Pending transaction | Open the explorer link, inspect balance/gas/nonce. Avoid duplicate submissions. Speed-ups are supported when recognized as the same transaction repriced. |
| RPC timeout / rate limits | Retry or use a suitable provider; log range limits are split automatically. Authentication and quota failures are not silently converted to “Not registered.” |
| Preflight works but browser fails | Check CORS, allowed origins, HTTPS, frontend endpoint permissions, browser console, and provider quotas. |
| Local hashing unavailable | Use HTTPS or localhost. Plain HTTP on a LAN IP is not a secure browser context. |
| Blank page / failed JavaScript | Confirm the built assets were uploaded, correct host root/fallback, supported browser, and Vite build succeeded. |
| “Already registered” during a later demo | Hashes are globally unique within this registry, including revoked records. Use a new synthetic document or reset the demo with an explicitly chosen new deployment. |
| File visually identical but not registered | Compare exact bytes, line endings, metadata, conversions, and selected registry. Visual equality is not byte equality. |
| Test browser cannot launch | Install a Playwright browser and dependencies; allow localhost servers and browser processes in your execution environment. |
| Hardhat cache permission error | Give your user a writable Hardhat config/cache directory; do not run the project as root to hide permission problems. |

## 12. Finish the submission

Follow `SUBMISSION.md` to run the live demo, record real transaction hashes, capture verified/revoked screens, update the README deployment table, and review the files to submit. Local test success alone does not finish the public-testnet requirement.
