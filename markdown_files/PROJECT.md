# PROJECT.md — DocChain: Tamper-Evident Document Issuance and Verification

## 1. Project idea

DocChain lets an authorized organization publish a fingerprint of a document (its SHA-256 hash) on a public blockchain. Anyone can later check a copy of that document against the blockchain record. The check answers three questions:

1. Is this document byte-for-byte identical to the one that was issued?
2. Which registered issuer issued it, and when?
3. Has the issuer revoked it since?

The document itself stays private. Only the fingerprint is stored on-chain, so no personal data is published.

This project is an adaptation of the hackathon problem **AF-14 "Digital Identity Verification and Document Tampering Detection System"**, narrowed to what a blockchain can solve well within a short build.

## 2. The problem

Certificates, transcripts, employment letters, professional licences, and official notices are routinely forged, altered, or copied. Verification today is usually done by:

- Phoning the issuing office,
- Emailing a verification desk and waiting days,
- Trusting a PDF because it looks official,
- Or in some cases accepting a scanned copy without any check.

Each of these methods depends on a single authority being reachable, responsive, and honest about its own records. When that authority is slow, closed on weekends, in another country, or has been replaced or dissolved, verification fails. Employers and banks then either accept fraudulent documents or reject genuine ones.

The underlying problem is that **a copy of a document carries no provable link to the original**. A PDF can be edited in seconds, and a screenshot of a certificate looks identical to the real one.

## 3. Why blockchain is a fit (and why it is not a gimmick here)

A blockchain is useful for this problem for four specific reasons:

1. **Tamper-evidence**: once a hash is written, nobody can change it. Changing the document changes its hash, which no longer matches.
2. **Public verifiability**: any verifier can check without contacting the issuer, without an account, and without trusting a website's database.
3. **Timestamped issuance**: the block timestamp proves the document was registered no later than a given moment. This helps against backdated claims.
4. **Durable record**: the record survives even if the issuer's website goes offline.

We deliberately do **not** put the document on-chain. Storing documents on-chain would be expensive, would publish private data permanently, and would be unnecessary. A hash gives the same integrity guarantee at a tiny cost.

## 4. Current limitations of existing solutions

| Existing approach | Limitation |
|---|---|
| Phone or email verification with the issuer | Slow, manual, depends on office hours and staff, often unavailable across borders. |
| Paper certificates with seals and watermarks | Easy to copy, hard to check remotely, seals are often reproduced. |
| PDF with digital signature | Requires certificate infrastructure, can be validated only with specific software, and signature trust depends on a central certificate authority. |
| Centralized verification portals (university or government websites) | Single point of failure, the portal can go down or be retired, the operator can alter records, and users must trust the operator. |
| Centralized document registries (private vendors) | Vendor lock-in, recurring cost, and the vendor holds sensitive data. |
| Existing blockchain certificate projects (some commercial) | Often tied to a specific vendor, closed source, or require the verifier to install a particular app. |

DocChain uses an open, public contract. Anyone can read it, and no one can silently edit the records.

## 5. Likely impact if implemented

### For issuers (universities, employers, government offices)
- Issue a verifiable record once, and let the world check it without a phone call.
- Reduce the workload of verification desks.
- Revoke a document publicly if it was issued in error or the holder has lost eligibility.

### For verifiers (employers, banks, landlords, visa offices)
- Check a document in seconds, free of charge, from any browser.
- See who issued it and when, and whether it is revoked.
- Lower fraud exposure without needing to contact a third party.

### For document holders (students, employees, applicants)
- Share a verifiable proof that does not depend on the holder's own copy being trusted.
- Keep the original document private; only the fingerprint is public.

### For society
- Reduces certificate fraud, which undermines hiring, admissions, and public trust.
- Makes credential checks cheaper for small employers and cross-border applications.

Scale of the problem: credential fraud is widely reported across education and hiring, and manual verification is a known cost for employers and admissions offices. We do not claim exact figures in this proof of concept.

## 6. Limitations of DocChain itself

These limits must be stated honestly in the README and in any presentation.

1. **Integrity is not truth.** A matching hash proves the document is identical to what the issuer registered. It does not prove the issuer was right to issue it, or that the content is accurate.
2. **Issuer trust remains.** The contract trusts the owner's whitelist of issuers. If an issuer is malicious or its key is stolen, it can register false documents. Revocation can fix this only after the fact.
3. **Lost or changed originals.** If the holder loses the original file, the hash cannot reconstruct it. The holder must keep the file.
4. **Format sensitivity.** Re-saving a PDF, changing its compression, or printing and scanning it produces a different hash. Only the exact file works. This is a real usability cost.
5. **Not found is not proof of forgery.** A "not registered" result may mean the document was never registered, was registered by an issuer not using this system, or is a fake. The interface must say so.
6. **Public data permanence.** Hashes and issuer addresses are permanent on a public chain. A hash of a small or guessable document could in theory be checked by guessing the content. For this reason, real deployments should salt the hash or hash a structured record that includes a random nonce, which is noted as future work.
7. **Privacy law.** Storing even a hash may be treated as personal data in some jurisdictions, and blockchains make the right to erasure hard to satisfy. This proof of concept does not address legal compliance.
8. **Test network only.** This project runs on Sepolia test ETH, which has no monetary value. Gas costs and availability on mainnet are not evaluated here.
9. **Wallet dependence.** Issuers need a crypto wallet and must manage their keys. Verifiers do not need a wallet.

## 7. Limits of replacing existing products

Replacing existing verification systems entirely is not realistic, and this project does not propose it. Important limits:

- **Institutional inertia.** Universities, governments, and employers already have records systems and legal procedures. Changing them requires policy approval, staff training, and budget.
- **Legal recognition.** Many jurisdictions only accept certain signed or notarized documents as legally valid. A blockchain record may be supporting evidence, not a replacement for the official document.
- **Dependency on issuers adopting the system.** A verifier can check only documents that were registered. Unregistered older documents still need traditional checks, so the system only works gradually.
- **Interoperability.** Existing e-signature and certificate standards (such as PDF signatures and verifiable-credential standards) already exist. A realistic future path is integrating with them, not competing with them.
- **Key management.** Institutions must safely store signing keys. Losing a key can lock an issuer out, and a stolen key can issue false records.
- **Usability for non-technical users.** Wallets and gas fees are a barrier. A production version would need custodial or gasless options for issuers, which introduce their own trust trade-offs.
- **Governance.** Someone must decide who can become an issuer and how disputes about revocation are handled. The contract only enforces the rules; it cannot make these social decisions.

The most realistic adoption route is a **hybrid**: existing institutions keep their records and processes, and add a public hash registration as an additional, cheap, and independently verifiable check.

## 8. Success criteria for this proof of concept

- A registered document verifies as "Verified" on the public site.
- A one-byte change to the same document produces "Not registered".
- A revoked document shows "Revoked".
- A non-issuer cannot register a document.
- Everything runs on a public test network with a published contract address.
