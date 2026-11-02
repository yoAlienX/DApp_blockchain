# AGENT.md — Rules for the Coding Agent (Codex)

You are building **DocChain**, a small DApp described in CONTEXT.md, executed in the order given in PLAN.md, and tracked in TODO.md. Read all three before writing any code. If anything here conflicts with these files, these rules win.

The priority order is: **1) working and tested, 2) matches the spec exactly, 3) looks good, 4) extra features.** Never trade 1 or 2 for 3 or 4.

---

## 1. Read before you write

- Before starting any phase, read the matching section of PLAN.md and CONTEXT.md.
- Before editing a file, read the current contents of that file. Do not assume its contents from memory.
- Before using any library function, check the installed version in `package.json` and, if unsure of the API, read `node_modules/<package>` type definitions or README. Do not guess method names.
- If a required piece of information is missing (an address, a key, a URL), stop and ask. Do not invent placeholder values that look real.

## 2. Stack (fixed, do not change)

- Smart contract: Solidity `^0.8.20`, Hardhat with `@nomicfoundation/hardhat-toolbox`, tests with Chai via Hardhat.
- Frontend: React (Vite template, JavaScript not TypeScript), Tailwind CSS v3, `react-router-dom`, `ethers` v6 only.
- Icons: `lucide-react`. No other UI libraries (no MUI, no Chakra, no shadcn) unless explicitly asked.
- Network: Sepolia only (chainId `11155111`). Do not add Mainnet, Polygon, or any other network.
- Do not use web3.js. Do not use Wagmi or RainbowKit. Use raw `window.ethereum` via ethers `BrowserProvider`.

## 3. ethers v6 — correct API (common mistakes to avoid)

Use these exact forms:
- Read-only provider: `new ethers.JsonRpcProvider(url)`
- Wallet provider: `new ethers.BrowserProvider(window.ethereum)`
- Signer: `await provider.getSigner()`
- Contract: `new ethers.Contract(address, abi, runnerOrProvider)`
- Read call: `await contract.verify(hash)` returns a Result; access fields by name or index.
- Write call: `const tx = await contract.issue(hash); const receipt = await tx.wait();`
- Event query: `await contract.queryFilter(contract.filters.DocumentIssued(), fromBlock, toBlock)`
- Units: `ethers.formatEther`, `ethers.parseEther`. Do not use `ethers.utils.*` (that is ethers v5).
- Do not use `Web3Provider` (v5). Do not use `provider.getSigner().getAddress()` synchronously.
- Chain id comparison: `(await provider.getNetwork()).chainId` is a `bigint` in v6. Compare with `11155111n` or `BigInt(import.meta.env.VITE_CHAIN_ID)`. Never compare with `===` against a plain number.

Check that `ethers` in `package.json` starts with `^6.`. If the agent installs without a version, it must pin `ethers@^6`.

## 4. Smart contract rules

- Implement exactly the functions and events in CONTEXT.md section 3. Do not rename them.
- Use custom errors, not `require` strings.
- Use `bytes32` for document hashes. Do not use `string`.
- Use `uint64` for timestamps to match the struct.
- Emit every event listed in CONTEXT.md. Tests must check event emission.
- Do not add upgradeability, proxies, token logic, or payment logic.
- Do not use `tx.origin` for authorization. Use `msg.sender`.
- Run `npx hardhat test` after every change to the contract. Do not proceed if tests fail.
- Never change the contract after deploying it to Sepolia without also redeploying and updating `VITE_CONTRACT_ADDRESS` and the ABI copy in the frontend. Warn the user before doing this.

## 5. Frontend rules

- Use functional components and hooks only.
- Put chain logic in `src/lib/` and `src/hooks/`. Components must not call `new ethers.Contract` directly.
- Read all configuration from `src/config.js`. Do not hard-code the contract address, RPC URL, or chain id anywhere else.
- Every async action must handle loading, success, and error states. Never leave a promise unhandled.
- Show user-friendly messages. Map MetaMask error code `4001` to "Transaction cancelled in wallet." Do not show raw stack traces.
- Hashing must use `crypto.subtle.digest("SHA-256", ...)`. Do not add a third-party hashing library.
- Do not use `localStorage` or `sessionStorage` for any app state in this project.
- Verify page must work without a wallet, using the read-only provider.
- Use Tailwind utility classes. Do not write custom CSS except for the base file `index.css` (Tailwind directives and font import).
- Use the color tokens, typography, and spacing from CONTEXT.md section 4. Do not invent new brand colors.
- Use semantic HTML: `button` for actions, `a` for navigation, `label` for every input, `main`, `nav`, `header`.
- Do not add animations beyond simple `transition-colors` and a single spinner.

## 6. Security rules (strict)

- Never write a private key, seed phrase, or mnemonic into any file in the repo. Only `.env` (git-ignored) may hold the deployer key, and only a dummy test-wallet key.
- Never commit `.env`. Verify with `git status` before every commit.
- `.env.example` files must contain empty values or obvious placeholders such as `your_sepolia_rpc_url_here`.
- Frontend `.env` must contain public values only (contract address, public RPC URL, chain id).
- Do not print private keys or RPC keys in logs, terminal output, or the README.
- Do not request permissions beyond what is needed. Use `eth_requestAccounts` only on explicit user click.
- Do not auto-connect the wallet on page load. Use `eth_accounts` (silent) to restore state if the user has already connected.

## 7. Testing and verification

- After Phase 1: `npx hardhat test` passes with all listed tests.
- After Phase 3 and Phase 4: `npm run build` in `frontend/` completes with zero errors. Warnings are acceptable only if they are about bundle size.
- Before reporting a feature as done, run it through the actual flow on Sepolia and record the transaction hash.
- Never claim a feature works without running it. If you cannot run it (no network, no wallet), say so explicitly.

## 8. Scope discipline

- Build only what is in CONTEXT.md section 2 and PLAN.md.
- Do not add features listed under "OUT" in CONTEXT.md section 1.
- Do not add a backend server, database, IPFS, analytics, or login system.
- Do not add extra pages, extra contract functions, or extra env variables beyond those specified.
- If you think a feature is missing and important, write it into TODO.md under "Suggested later" and continue with the current task. Do not implement it.

## 9. Documentation rules

- README.md must include every item required by the course guidelines: project description, features, steps to deploy the contract, steps to run the frontend, contract address and test network, and at least one UI screenshot.
- Every command written in the README must be a command that was actually run and worked. Do not write commands from memory without testing them.
- Keep the contract address in README in sync with `VITE_CONTRACT_ADDRESS`.
- Use the exact name `DocChain` in the README title and the page title.

## 10. Working with TODO.md

- At the start of every work session, read TODO.md and continue the item marked "In progress". If none is in progress, take the first item under "Next".
- When starting a task, move it to "In progress" with a timestamp.
- When finishing a task, move it to "Done" and write one line about what was verified (for example, "tests pass, 11/11").
- If a task is blocked, move it to "Blocked" with the exact error message and what you tried. Do not silently skip it.
- Update TODO.md before the end of every work session.

## 11. Things the agent must never do

- Never invent a contract address, transaction hash, or Etherscan link.
- Never claim a test passed without running it.
- Never use `any` placeholders to silence errors in code that will ship.
- Never use `// TODO` comments in code instead of doing the work. Track work only in TODO.md.
- Never use real funds, mainnet RPC endpoints, or a wallet with real assets.
- Never delete or rewrite the contract tests to make them pass. Fix the contract instead, and explain the change.
- Never disable ESLint rules or Solidity warnings globally to hide problems.
- Never add dependencies not listed in these files without writing the reason in TODO.md first.
- Never generate fake screenshots or mockups in place of real screenshots of the running app.
- Never describe the project as production-ready, audited, or secure beyond a proof of concept.

## 12. How to report progress

When reporting at the end of a task, use this format:
- What was done (one or two sentences)
- How it was verified (command run and result, or transaction hash)
- What is next
- Any blocker or risk

Keep reports short. Do not pad with generic praise or filler.

## 13. When unsure

If the spec is ambiguous, choose the simplest option that satisfies the guidelines, write the choice and the reason in TODO.md under "Decisions", and continue. Do not stop for minor choices. Stop and ask only for: missing secrets, a broken external service that blocks progress, or a conflict between CONTEXT.md and PLAN.md.
