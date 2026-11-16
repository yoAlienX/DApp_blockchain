# Final submission and demonstration

## Current gate

The code and local checks are complete. **The public-testnet submission is not complete until this checklist has real deployment and browser evidence.** No private keys, recovery phrases, privileged RPC keys, or fabricated transaction hashes belong in this document.

## Required submission package

- [ ] Source repository accessible to the evaluator; include both dependency lockfiles.
- [ ] Real Sepolia registry address, deployment transaction, block, and owner public address.
- [ ] Demo issuer authorized on that registry and funded with Sepolia test ETH.
- [ ] Hosted HTTPS frontend, or an explicitly approved local-demo alternative.
- [ ] README deployment/network table completed with actual public values.
- [ ] Wallet-free verification, issuance, tampering detection, and revocation demonstrated on Sepolia.
- [ ] At least one real **Verified** screenshot; preferably Issue success, Revoked, and Activity too.
- [ ] Automated checks pass from a clean install.
- [ ] All secrets, `node_modules`, caches, and test traces excluded from the submission.
- [ ] Limitations clearly explained; describe a testnet proof of concept, not an audited production service.

## Public evidence worksheet

Fill from actual confirmed operations. The deployment script creates a public manifest under `deployments/` automatically. Do not copy addresses/transactions from browser tests into this table.

| Evidence | Actual value |
| --- | --- |
| Submission date / deadline | 17 Nov 2026 |
| Repository URL | <https://github.com/yoAlienX/DApp_blockchain> |
| Hosted application URL | <https://sealmark-dapp.vercel.app> |
| Network / chain ID | Sepolia / 11155111 |
| Registry address | `0x1f188319a11993F6436EB8cBE1Ca5FC4C12C816E` |
| Registry owner (public address) | `0xd48ea9481804f5DeF538744493830260e60D7a53` |
| Deployment transaction | `0xae984d7a14e39004fc9ef356447f31cbbdee400e2a8b6d8795f15aed4c5747e6` |
| Deployment block | `12145646` |
| Explorer contract link | <https://sepolia.etherscan.io/address/0x1f188319a11993F6436EB8cBE1Ca5FC4C12C816E> |
| Demo issuer (public address) | `0xd48ea9481804f5DeF538744493830260e60D7a53` |
| Issuer authorization transaction | `0xdd75f1aa99937828620683e5d807e5c1cb9bed79d8d1268c8506abbae3ffded1` |
| Demo file SHA-256 fingerprint | Pending live issue |
| Document issuance transaction | Pending |
| Document revocation transaction | Pending |
| Contract source verification | Optional / pending |
| Live checks completed at | Pending |

## Prepare your demo documents

`docs/demo/original.txt` and `docs/demo/altered.txt` contain only fictional data and differ in the grade field. Neither has been registered on Sepolia by this session.

Their current exact SHA-256 fingerprints (including the final newline) are:

```text
original.txt
0xf72095cad18c96031c79d73900811886b4857547f4c08a1cb85695215e70ea04

altered.txt
0x1ed1e639fbd24fddd5f62cd3b8936f254b4054004931c9ac5679655f744c4bbd
```

Do not register the altered file during the tampering demonstration: the expected outcome is **Not registered**. Use the original bytes rather than copying from a rendered webpage. Git attributes preserve these demo files without automatic line-ending conversion. Editing either file changes its hash; the browser’s computed value is authoritative for the selected bytes.

Revocation is permanent and duplicates remain blocked. For a rehearsal followed by the final demo on the same registry, make a **new synthetic original/altered pair** with a new reference value before the final demo, and use those exact files throughout. Do not repeatedly try to reissue the revoked rehearsal file.

## Five-minute live demonstration

### 1. Explain the problem (30 seconds)

“DocChain records document fingerprints rather than storing documents. An authorized issuing wallet registers a hash. Anyone can compare the exact file against that public record and see whether it has been revoked.”

Show the hosted URL and the actual Sepolia contract link in the footer. Mention that a hash match proves integrity relative to the registered record, not factual truth or institutional identity.

### 2. Issue the original (60–90 seconds)

1. Open Issue. Connect the funded authorized test wallet and switch to Sepolia.
2. Show the **Authorized issuer** status and selected wallet address.
3. Choose `original.txt` (or your fresh synthetic pair’s original).
4. Show the locally computed fingerprint; do not change the document afterward.
5. Click Register on Sepolia and approve the transaction in MetaMask.
6. Show the pending explorer link and confirmed result. Record the real transaction hash.
7. Capture an Issue success screenshot without private wallet screens or provider credentials.

### 3. Verify without a wallet (45 seconds)

1. Open the same site in an incognito/profile without MetaMask or wallet authorization.
2. Choose the exact original file on Verify.
3. Show **Verified**, the original issuer address, and registration time.
4. Capture `docs/screenshots/verify-live.png` and include it in the README.

### 4. Demonstrate tampering (30 seconds)

1. Choose the altered file with the changed grade.
2. Show the different fingerprint and **Not registered** result.
3. Explain why “not registered” alone does not establish forgery: it can also mean never issued here, a changed export, or a different registry.

### 5. Revoke and inspect history (60–90 seconds)

1. Return to Issue in the issuer’s wallet-enabled browser.
2. Paste the original fingerprint into Revoke and click Check record.
3. Check the explicit permanent-revocation acknowledgement.
4. Click Revoke permanently and approve in MetaMask.
5. Record the revocation transaction, then recheck the original in the wallet-free browser using Check again.
6. Show **Revoked**, with the issuer and original registration date still visible.
7. Open Activity and refresh; show the revocation and issuance links, newest first.
8. Capture `revoke-live.png` and `activity-live.png` if useful. These must come from the real live run, not the isolated tests.

## Final acceptance checks

```bash
npm run check
npm run test:e2e
npm run check-deployment
git diff --check
git status --short
```

The last deployment check requires real configured endpoints and accounts. Tests do not deploy publicly. Check direct `/issue` and `/activity` navigation on your host, mobile layout at 375 px, clipboard feedback, an unauthorized wallet, wrong-network handling, and a rejected MetaMask transaction. Wait for each transaction’s explorer status before retrying uncertain operations.

## Submission hygiene

- Include source, tests, configs, lockfiles, README, setup guide, screenshots, and public deployment manifest.
- Exclude `.env`, `frontend/.env`, wallet exports, phrases/keys, `node_modules`, `artifacts`, `cache`, `test-results`, and Playwright traces. Traces can include provider URLs and are not public evidence.
- The pre-existing `chat.md`, `markdown_files.zip`, and planning notes are background material; review their contents and your course requirements before deciding whether to include them.
- Root `.env` and frontend `.env` are intentionally not created with fabricated values or committed by this completion work.
- No commit, push, repository visibility change, hosting deployment, or external transaction has been performed automatically.

## Short viva notes

- **Why blockchain?** Publicly readable, timestamped issuance and irreversible revocation history without a private verification database. The owner still governs issuer trust.
- **Why SHA-256?** A deterministic 32-byte fingerprint calculated by the browser’s Web Crypto API. The contract stores it as `bytes32`, not as document content.
- **Why no backend/IPFS?** Verification needs only a local fingerprint and public chain reads; file storage is deliberately out of scope.
- **What is private?** The app does not transmit document bytes or filenames. Public unsalted hashes can nevertheless reveal relationships to known/guessable documents.
- **What happens when an issuer is removed?** New issuance is blocked. Old records remain valid until the original issuer revokes them, which it may still do after removal.
- **What happens if keys are lost?** This contract has no key-recovery/owner-transfer mechanism. A production design needs audited governance and key management.
- **What was tested locally versus live?** Local tests exercise actual Solidity bytecode and real browser flows using an isolated EVM and wallet adapter. MetaMask, funding, real RPC limits, CORS, hosting, and Sepolia confirmations need the separate live demonstration.
