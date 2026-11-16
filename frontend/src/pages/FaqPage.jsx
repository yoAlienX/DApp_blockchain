import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FileCheck2, HelpCircle, Landmark, ShieldCheck } from 'lucide-react';

const FAQS = [
  {
    q: 'Are my uploaded files stored on the blockchain or a server?',
    a: 'No. Your browser computes a 32-byte SHA-256 fingerprint locally using the Web Crypto API. The file contents and filename never leave your device—only the cryptographic hash is checked or stored on Sepolia.'
  },
  {
    q: 'What is the difference between a Standard User and an Authority Admin?',
    a: 'Standard Users can verify whether any document is registered and valid on Sepolia, inspect public activity logs, and manage their own profile. Authority Admins represent issuing organizations and can register new document hashes, revoke their own issuances, and (if owner) manage authorized issuing wallets.'
  },
  {
    q: 'Why did my verified PDF show "Not registered" after I re-saved or renamed it?',
    a: 'Changing even a single byte inside a file (such as re-exporting a PDF, editing metadata, or changing line endings) produces a completely different SHA-256 fingerprint. Always verify the exact original digital file provided by the issuer.'
  },
  {
    q: 'Do citizens need MetaMask or test ETH to verify a document?',
    a: 'No. Verification and Activity log viewing use a public Sepolia RPC endpoint in read-only mode. Only Authority Admins performing on-chain writes (issuing, revoking, or updating issuers) need MetaMask and Sepolia ETH for gas.'
  },
  {
    q: 'What does "Revoked" mean, and can a revoked document be re-issued?',
    a: 'Revoked means the original issuing wallet permanently invalidated that document hash on-chain (for example, if a certificate was superseded or issued in error). Revocation is irreversible—once revoked, the same hash cannot be re-issued.'
  },
  {
    q: 'How does "Continue where you left off" work after logging out?',
    a: 'When you sign out from your account, SealMark saves your last visited workspace screen and session summary in local browser storage. When you sign back in with the same account, you are returned directly to that screen.'
  }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="eyebrow">Guide &amp; FAQ</p>
        <h1 className="mt-2">How to use SealMark</h1>
        <p className="lead">
          Step-by-step instructions for verifying official documents as a user and issuing records as an authority administrator.
        </p>
      </div>

      {/* How-To Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card" aria-labelledby="guide-user">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="text-indigo-600 dark:text-indigo-400" size={20} aria-hidden="true" />
            <h2 id="guide-user">For Users (Verifying Documents)</h2>
          </div>
          <ol className="mt-4 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
            {[
              ['Open the Verify page', 'Go to Verify from the top navigation or the landing page. No wallet connection is needed.'],
              ['Choose your document or hash', 'Drop the exact original file (up to 25 MB) or switch to the SHA-256 Hash tab and paste a 0x fingerprint.'],
              ['Review the on-chain status', 'See whether the document is Verified, Revoked, or Not registered, along with the issuer address and timestamp.']
            ].map(([title, desc], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="mt-0.5 leading-6">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <Link to="/verify" className="button-primary text-xs">
              Go to Verify
            </Link>
          </div>
        </section>

        <section className="card" aria-labelledby="guide-admin">
          <div className="flex items-center gap-2.5">
            <Landmark className="text-indigo-600 dark:text-indigo-400" size={20} aria-hidden="true" />
            <h2 id="guide-admin">For Authorities (Issuing &amp; Revoking)</h2>
          </div>
          <ol className="mt-4 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
            {[
              ['Sign in as Authority Admin', 'Log in with an Admin account on the Sign In page and connect your authorized MetaMask wallet on Sepolia.'],
              ['Register a document fingerprint', 'Select the final file on the Admin Portal and click Register on Sepolia to confirm the transaction in MetaMask.'],
              ['Revoke or manage issuers', 'Revoke records issued by your wallet permanently, or add/remove issuing addresses if you own the contract.']
            ].map(([title, desc], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="mt-0.5 leading-6">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <Link to="/admin" className="button-secondary text-xs">
              Open Admin Portal
            </Link>
          </div>
        </section>
      </div>

      {/* FAQ Accordion */}
      <section className="card" aria-labelledby="faq-list-heading">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={20} aria-hidden="true" />
          <h2 id="faq-list-heading">Frequently Asked Questions</h2>
        </div>

        <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q} className="py-3">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left text-sm font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="pb-2 pr-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
        <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Ready to check a certificate or official file?</span>
        </div>
        <Link to="/verify" className="button-primary text-xs">
          Launch Verifier
        </Link>
      </div>
    </div>
  );
}
