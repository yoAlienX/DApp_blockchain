import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Lock, RefreshCw, ShieldAlert, Upload, UserCog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useIssue } from '../hooks/useIssue';
import { configErrors } from '../config';
import {
  FileDropzone,
  HashDisplay,
  InlineError,
  RecordDetails,
  SelectedFileBar,
  Spinner,
  StatusBadge,
  Toast,
  TxStatus
} from '../components';

export default function IssuePage() {
  const auth = useAuth();
  const wallet = useWallet();
  const issue = useIssue(wallet);
  const [confirmation, setConfirmation] = useState('');
  const [issuerTarget, setIssuerTarget] = useState('');
  const revokeFileInput = useRef(null);

  if (!auth.isLoggedIn) {
    return (
      <div className="mx-auto max-w-xl card text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Lock size={22} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl">Authority Admin Sign-In Required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Issuing new document fingerprints, revoking records, and managing authorized wallets require an authenticated <strong>Authority Admin</strong> account.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/login" state={{ from: '/admin' }} className="button-primary">
            Sign in as Authority Admin
          </Link>
          <Link to="/verify" className="button-secondary">
            Go to Document Verifier
          </Link>
        </div>
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-xl card text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <ShieldAlert size={22} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl">Restricted to Issuing Authorities</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          You are currently signed in as a <strong>Standard User</strong> ({auth.user?.name}). Standard User accounts can verify documents and inspect activity logs, but cannot register or revoke records on Sepolia.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/verify" className="button-primary">
            Verify a Document
          </Link>
          <button
            type="button"
            onClick={() => auth.logout()}
            className="button-secondary"
          >
            Log out &amp; switch account
          </button>
        </div>
      </div>
    );
  }

  const ready = Boolean(wallet.account && !wallet.wrongNetwork && !configErrors.length);
  const revokeKey = `${wallet.account}:${issue.revokeHash}`;
  const canRevoke = ready && issue.ownsRecord && !issue.revokeCheck.record.revoked && confirmation === revokeKey && !issue.busy;
  const issued = issue.transaction.operation === 'issue' && issue.transaction.state === 'success';

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Authority Admin Portal</p>
        <h1 className="mt-2">Issue &amp; revoke documents</h1>
        <p className="lead">
          Register a document’s SHA-256 fingerprint on Sepolia, permanently revoke a record issued by your authority, or manage authorized issuer addresses.
        </p>
      </div>

      {!wallet.account ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="max-w-2xl leading-6">
            Connect MetaMask on the <strong>Sepolia</strong> test network to sign issuance and revocation transactions.
          </p>
          <button type="button" onClick={wallet.connect} disabled={wallet.loading} className="button-primary">
            {wallet.loading ? 'Connecting…' : 'Connect MetaMask'}
          </button>
        </div>
      ) : wallet.wrongNetwork ? (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Wrong network detected. Use <strong>Switch to Sepolia</strong> in the header before submitting transactions.
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Connected authority wallet ({auth.user?.organization || 'Admin'})
            </p>
            <p className="mt-0.5 break-all font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{wallet.account}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {issue.isIssuer && <StatusBadge kind="verified">Authorized issuer</StatusBadge>}
            {issue.isOwner && <StatusBadge kind="info">Registry owner</StatusBadge>}
            {!issue.isIssuer && !issue.isOwner && ready && issue.access.status === 'denied' && (
              <StatusBadge kind="unknown">Wallet not whitelisted</StatusBadge>
            )}
            {wallet.isAuthenticated ? (
              <StatusBadge kind="verified">Signature verified</StatusBadge>
            ) : (
              <button
                type="button"
                disabled={wallet.signingAuth || issue.busy}
                onClick={wallet.authenticateSession}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
              >
                {wallet.signingAuth ? <><Spinner />Signing…</> : 'Verify signature'}
              </button>
            )}
            {ready && !issue.busy && issue.access.status !== 'checking' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={issue.refreshAccess}
              >
                <RefreshCw size={13} aria-hidden="true" />
                Refresh access
              </button>
            )}
          </div>
        </div>
      )}
      {wallet.authError && <div className="mb-6"><InlineError>{wallet.authError}</InlineError></div>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card min-w-0" aria-labelledby="issue-title">
          <div className="flex items-center gap-2.5">
            <FilePlus2 className="text-indigo-600 dark:text-indigo-400" size={20} aria-hidden="true" />
            <h2 id="issue-title">New issuance</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Select the final file you plan to distribute. Its SHA-256 fingerprint is computed locally and stored on-chain.
          </p>

          {issue.access.status === 'checking' && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Spinner />
              Checking issuer permissions…
            </p>
          )}
          {ready && issue.access.status === 'denied' && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              This wallet is not authorized to issue. Ask the registry owner to add this address. You can still revoke records originally issued by this wallet.
            </p>
          )}
          <InlineError>{issue.access.error}</InlineError>

          <FileDropzone onFile={issue.selectFile} disabled={!ready || !issue.isIssuer || issue.busy || issue.selection.loading} />
          <SelectedFileBar file={issue.selection.file} />

          {issue.selection.loading && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Spinner />
              Calculating SHA-256 fingerprint…
            </p>
          )}
          <InlineError>{issue.selection.error}</InlineError>

          {issue.selection.hash && (
            <div className="mt-4">
              <p className="label">SHA-256 fingerprint</p>
              <HashDisplay hash={issue.selection.hash} />
            </div>
          )}

          <button
            onClick={issue.issue}
            disabled={!ready || !issue.isIssuer || !issue.selection.hash || issue.selection.loading || issue.busy || issued}
            aria-busy={issue.busy && issue.transaction.operation === 'issue'}
            className="button-primary mt-5 w-full"
          >
            Register on Sepolia
          </button>

          {issue.transaction.operation === 'issue' && <TxStatus transaction={issue.transaction} />}

          {issue.existingRecord && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <StatusBadge kind={issue.existingRecord.revoked ? 'revoked' : 'verified'}>
                {issue.existingRecord.revoked ? 'Already revoked' : 'Already registered'}
              </StatusBadge>
              <RecordDetails record={issue.existingRecord} />
            </div>
          )}

          {issued && (
            <>
              <Toast message="Fingerprint registered on Sepolia. Keep and share the exact original file." />
              <Link to="/verify" className="mt-4 inline-block text-sm font-medium text-indigo-700 underline underline-offset-2 dark:text-indigo-400">
                Verify your document →
              </Link>
            </>
          )}
        </section>

        <section className="card min-w-0" aria-labelledby="revoke-title">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-rose-600 dark:text-rose-400" size={20} aria-hidden="true" />
            <h2 id="revoke-title">Revoke an issuance</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Only the original issuing wallet can revoke a record. Revocation is permanent and cannot be undone.
          </p>

          <div className="mt-5 flex items-center justify-between gap-2">
            <label className="label mb-0" htmlFor="revoke-hash">Document fingerprint</label>
            <button
              type="button"
              disabled={!ready || issue.busy}
              onClick={() => revokeFileInput.current?.click()}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Upload size={12} aria-hidden="true" />
              Compute from file
            </button>
            <label htmlFor="revoke-file-input" className="sr-only">Upload file to hash for revocation</label>
            <input
              id="revoke-file-input"
              ref={revokeFileInput}
              type="file"
              disabled={!ready || issue.busy}
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  setConfirmation('');
                  issue.selectRevokeFile(file);
                }
              }}
            />
          </div>

          <input
            id="revoke-hash"
            value={issue.revokeHash}
            onChange={event => { setConfirmation(''); issue.changeRevokeHash(event.target.value); }}
            disabled={!ready || issue.busy}
            placeholder="0x followed by 64 hexadecimal characters"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
          />

          <button
            onClick={() => { setConfirmation(''); issue.checkRevokeHash(); }}
            disabled={!ready || !issue.revokeHash || issue.revokeCheck.loading || issue.busy}
            className="button-secondary mt-3"
            aria-busy={issue.revokeCheck.loading}
          >
            {issue.revokeCheck.loading ? <><Spinner />Checking…</> : 'Check record'}
          </button>

          <InlineError>{issue.revokeCheck.error}</InlineError>

          {issue.revokeCheck.record && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">
                {!issue.revokeCheck.record.exists
                  ? 'This fingerprint is not registered.'
                  : issue.revokeCheck.record.revoked
                    ? 'This document is already revoked.'
                    : issue.ownsRecord
                      ? 'This document was issued by the connected wallet.'
                      : 'This document was not issued by the connected wallet.'}
              </p>
              <RecordDetails record={issue.revokeCheck.record} />
            </div>
          )}

          <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={confirmation === revokeKey}
              disabled={!ready || !issue.ownsRecord || issue.revokeCheck.record?.revoked || issue.busy}
              onChange={event => setConfirmation(event.target.checked ? revokeKey : '')}
              className="mt-1 h-4 w-4 shrink-0 rounded accent-rose-600"
            />
            <span>I understand this revocation is permanent and cannot be undone.</span>
          </label>

          <button
            onClick={issue.revoke}
            disabled={!canRevoke}
            aria-busy={issue.busy && issue.transaction.operation === 'revoke'}
            className="button-danger mt-4 w-full"
          >
            Revoke permanently
          </button>

          {issue.transaction.operation === 'revoke' && <TxStatus transaction={issue.transaction} />}
        </section>
      </div>

      {issue.isOwner && (
        <section className="card mt-6" aria-labelledby="owner-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <UserCog className="text-indigo-600 dark:text-indigo-400" size={20} aria-hidden="true" />
              <h2 id="owner-title">Issuer administration (Owner)</h2>
            </div>
            <StatusBadge kind="info">Owner controls</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add or remove wallet addresses authorized to issue new document fingerprints on this registry.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="issuer-address-input" className="label block">Issuer wallet address</label>
              <input
                id="issuer-address-input"
                value={issuerTarget}
                onChange={event => setIssuerTarget(event.target.value)}
                disabled={issue.busy}
                placeholder="0x..."
                autoComplete="off"
                spellCheck={false}
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={issue.busy || !issuerTarget.trim()}
                onClick={() => issue.addIssuer(issuerTarget)}
                className="button-primary"
              >
                Authorize issuer
              </button>
              <button
                type="button"
                disabled={issue.busy || !issuerTarget.trim()}
                onClick={() => issue.removeIssuer(issuerTarget)}
                className="button-secondary"
              >
                Remove issuer
              </button>
            </div>
          </div>
          {['addIssuer', 'removeIssuer'].includes(issue.transaction.operation) && <TxStatus transaction={issue.transaction} />}
        </section>
      )}
    </>
  );
}
