import { useState } from 'react';
import { FileCheck2, Hash, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { useVerify } from '../hooks/useVerify';
import { configErrors } from '../config';
import {
  FileDropzone,
  HashDisplay,
  InlineError,
  RecordDetails,
  SelectedFileBar,
  Spinner,
  StatusBadge,
  VerificationLoader
} from '../components';

export default function VerifyPage() {
  const verify = useVerify();
  const [mode, setMode] = useState('file');
  const [hashInput, setHashInput] = useState('');

  const switchMode = next => {
    setMode(next);
    verify.reset();
  };

  const submitHash = event => {
    event.preventDefault();
    verify.verifyHash(hashInput);
  };

  const resultTone = !verify.result
    ? ''
    : !verify.result.exists
      ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/30'
      : verify.result.revoked
        ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/30'
        : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30';

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Document Verification</p>
        <h1 className="mt-2">Verify a document on Sepolia</h1>
        <p className="lead">
          Check whether a file or SHA-256 fingerprint is registered on-chain, who issued it, and whether it remains valid. No wallet or account is required.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section className="card min-w-0" aria-labelledby="verify-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="text-indigo-600" size={20} aria-hidden="true" />
              <h2 id="verify-title">Verify a document</h2>
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800" role="tablist" aria-label="Verification method">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'file'}
                onClick={() => switchMode('file')}
                className={`rounded-md px-3 py-1.5 transition-colors ${mode === 'file' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                Upload file
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'hash'}
                onClick={() => switchMode('hash')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors ${mode === 'hash' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                <Hash size={13} aria-hidden="true" />
                SHA-256 hash
              </button>
            </div>
          </div>

          {mode === 'file' ? (
            <FileDropzone onFile={verify.verifyFile} disabled={verify.loading || configErrors.length > 0} />
          ) : (
            <form onSubmit={submitHash} className="mt-5 space-y-3">
              <label htmlFor="verify-hash-input" className="label block">SHA-256 fingerprint</label>
              <input
                id="verify-hash-input"
                value={hashInput}
                onChange={event => setHashInput(event.target.value)}
                disabled={verify.loading || configErrors.length > 0}
                placeholder="0x followed by 64 hexadecimal characters"
                autoComplete="off"
                spellCheck={false}
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
              />
              <button
                type="submit"
                disabled={verify.loading || !hashInput.trim() || configErrors.length > 0}
                className="button-primary"
              >
                {verify.loading ? <><Spinner />Checking…</> : 'Verify fingerprint'}
              </button>
            </form>
          )}

          <SelectedFileBar file={verify.file} />

          {verify.hash && (
            <div className="mt-4">
              <p className="label">SHA-256 fingerprint</p>
              <HashDisplay hash={verify.hash} />
            </div>
          )}

          <div aria-live="polite" aria-busy={verify.loading}>
            {verify.loading && <VerificationLoader hasHash={Boolean(verify.hash)} />}

            <InlineError>{verify.error}</InlineError>

            {verify.result && (
              <div className={`mt-6 rounded-xl border p-5 ${resultTone}`} data-testid="verification-result">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge kind={!verify.result.exists ? 'unknown' : verify.result.revoked ? 'revoked' : 'verified'}>
                    {!verify.result.exists ? 'Not registered' : verify.result.revoked ? 'Revoked' : 'Verified'}
                  </StatusBadge>
                  {verify.result.exists && !verify.result.revoked && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <ShieldCheck size={14} aria-hidden="true" />
                      Active on Sepolia
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {!verify.result.exists
                    ? 'No matching record was found in this registry. This does not by itself prove the document is forged—it may not have been issued here or may have been re-exported.'
                    : verify.result.revoked
                      ? 'This exact file was registered on-chain, but its original issuer has permanently revoked the record.'
                      : 'This exact file matches an active record registered by an authorized issuing wallet.'}
                </p>

                <RecordDetails record={verify.result} />
              </div>
            )}
          </div>

          {!verify.loading && (verify.file || verify.result || verify.error) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {verify.file && (
                <button type="button" className="button-secondary" onClick={() => verify.verifyFile(verify.file)}>
                  <RefreshCw size={14} aria-hidden="true" />
                  Check again
                </button>
              )}
              <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" onClick={() => { setHashInput(''); verify.reset(); }}>
                Clear
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="card">
            <h2>How verification works</h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              {[
                ['Select your file or hash', 'Choose the exact digital file you received, or paste its 32-byte SHA-256 fingerprint.'],
                ['Local fingerprint computation', 'Your browser computes the SHA-256 hash using the Web Crypto API. Files are never uploaded.'],
                ['Public registry lookup', 'SealMark reads the smart contract on Sepolia to confirm registration status, issuer, and timestamp.']
              ].map(([title, text], index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-900">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="mt-0.5 leading-6">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <LockKeyhole size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Privacy &amp; Scope</h2>
            </div>
            <p className="mt-2.5 text-sm leading-6 text-indigo-900/90 dark:text-indigo-200/90">
              Document contents and filenames stay on your device. Only the SHA-256 hash is sent to the Sepolia RPC to check the registry.
            </p>
            <p className="mt-2 text-xs leading-5 text-indigo-800/80 dark:text-indigo-300/80">
              A match confirms byte-for-byte integrity against an on-chain record issued by the listed wallet address.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
