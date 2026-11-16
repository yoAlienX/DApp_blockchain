import { useEffect, useId, useRef, useState } from 'react';
import { Check, CheckCircle2, UploadCloud, Copy, ExternalLink, AlertTriangle, XCircle, LoaderCircle, FileText, ShieldCheck } from 'lucide-react';
import { config } from './config';

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileDropzone({ onFile, disabled = false, label = 'Document file', compact = false }) {
  const input = useRef(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const choose = file => { if (!disabled && file) onFile(file); };
  return (
    <div
      onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0]); }}
      aria-disabled={disabled}
      className={`mt-4 rounded-xl border-2 border-dashed text-center transition-all ${compact ? 'p-4' : 'p-6 sm:p-8'} ${
        disabled
          ? 'border-slate-200 bg-slate-50/80 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
          : dragging
            ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-100 dark:border-indigo-400 dark:bg-indigo-950/40 dark:ring-indigo-900/50'
            : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-indigo-500 dark:hover:bg-slate-800/70'
      }`}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:ring-indigo-900">
        <UploadCloud size={22} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drop your document here, or browse</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Any file format · Max 25 MB · Hashed locally in your browser</p>
      <button type="button" disabled={disabled} onClick={() => input.current.click()} className="button-secondary mt-4">
        Choose file
      </button>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input
        id={inputId}
        ref={input}
        type="file"
        disabled={disabled}
        className="hidden"
        onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }}
      />
    </div>
  );
}

export function SelectedFileBar({ file }) {
  if (!file) return null;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800/60">
      <FileText className="shrink-0 text-indigo-600 dark:text-indigo-400" size={18} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
        {typeof file.size === 'number' && <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>}
      </div>
    </div>
  );
}

export function HashDisplay({ hash }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setCopied(false); setMessage(''); }, [hash]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setMessage('Copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage('Copy unavailable. Select and copy the fingerprint manually.');
    }
  };
  return (
    <div>
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
        <span className="min-w-0 flex-1 break-all select-all">{hash}</span>
        <button
          type="button"
          aria-label="Copy fingerprint"
          onClick={copy}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          {copied ? <Check size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        </button>
      </div>
      {message && <p role="status" className="mt-1 text-xs text-slate-600 dark:text-slate-400">{message}</p>}
    </div>
  );
}

export function StatusBadge({ kind, children }) {
  const [style, Icon] = {
    verified: ['bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800', CheckCircle2],
    revoked: ['bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800', XCircle],
    unknown: ['bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800', AlertTriangle],
    error: ['bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800', AlertTriangle],
    info: ['bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800', CheckCircle2]
  }[kind] || ['bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700', AlertTriangle];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Spinner() {
  return <LoaderCircle className="shrink-0 animate-spin" size={16} aria-hidden="true" />;
}

export function TxLink({ hash }) {
  return (
    <a
      className="inline-flex items-center gap-1 font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:decoration-indigo-700 dark:hover:text-indigo-300"
      href={`${config.explorerUrl}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
    >
      View transaction <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

export function TxStatus({ transaction }) {
  const { state, hash, error } = transaction;
  if (state === 'idle') return null;
  const pending = ['checking', 'awaiting-signature', 'pending'].includes(state);
  const message = {
    checking: 'Checking permissions and the latest document record…',
    'awaiting-signature': 'Confirm the transaction in your wallet…',
    pending: 'Submitted. Waiting for a Sepolia confirmation…',
    success: 'Transaction confirmed on Sepolia.',
    error
  }[state];
  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      className={`mt-5 rounded-xl border p-4 text-sm ${
        state === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'
          : state === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200'
      }`}
    >
      <p className="flex items-center gap-2 font-medium">{pending && <Spinner />}{message}</p>
      {hash && (
        <div className="mt-3 space-y-2">
          <p className="break-all font-mono text-xs opacity-90">{hash}</p>
          <TxLink hash={hash} />
        </div>
      )}
      {state === 'error' && hash && (
        <p className="mt-2 text-xs">
          A transaction was submitted. Check the explorer before retrying; a connection error does not mean it failed on-chain.
        </p>
      )}
    </div>
  );
}

export function InlineError({ children }) {
  return children ? (
    <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm leading-6 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
      {children}
    </p>
  ) : null;
}

export function EmptyState({ children = 'No activity found.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
      {children}
    </div>
  );
}

export function PageLoader({ label = 'Loading workspace…' }) {
  return (
    <div role="status" className="flex min-h-[45vh] flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-slate-800" />
        <span className="animate-orbit absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-400 dark:border-t-indigo-400" />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <ShieldCheck size={20} className="animate-pulse" aria-hidden="true" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Connecting to Sepolia registry interface</p>
      </div>
    </div>
  );
}

export function VerificationLoader({ hasHash }) {
  return (
    <div role="status" className="mt-5 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/30">
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-indigo-600 shadow-xs ring-1 ring-indigo-100 dark:bg-slate-900 dark:text-indigo-400 dark:ring-indigo-900">
          <FileText size={20} aria-hidden="true" />
          <span className="animate-scan absolute inset-x-0 top-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Spinner />
            {hasHash ? 'Querying Sepolia registry…' : 'Calculating SHA-256 fingerprint locally…'}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`inline-flex items-center gap-1 ${hasHash ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'font-medium text-indigo-700 dark:text-indigo-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${hasHash ? 'bg-emerald-500' : 'animate-ping bg-indigo-600'}`} />
              1. Local SHA-256
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className={`inline-flex items-center gap-1 ${hasHash ? 'font-medium text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${hasHash ? 'animate-ping bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
              2. On-chain lookup
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map(item => (
        <div key={item} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="animate-shimmer h-5 w-20 rounded-full" />
            <div className="animate-shimmer h-3 w-32 rounded" />
          </div>
          <div className="animate-shimmer mt-3 h-8 w-full rounded-lg" />
          <div className="mt-3 flex justify-between gap-4">
            <div className="animate-shimmer h-3 w-48 rounded" />
            <div className="animate-shimmer h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Toast({ message }) {
  return message ? (
    <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
      {message}
    </div>
  ) : null;
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp * 1000));
}

export function RecordDetails({ record }) {
  if (!record?.exists) return null;
  return (
    <dl className="mt-4 grid gap-3 border-t border-slate-200/80 pt-4 text-sm dark:border-slate-700/80 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Issuing wallet</dt>
        <dd className="mt-1 break-all font-mono text-xs">
          <a
            href={`${config.explorerUrl}/address/${record.issuer}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:decoration-indigo-700 dark:hover:text-indigo-300"
          >
            {record.issuer} <ExternalLink size={12} aria-hidden="true" />
          </a>
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Registered at</dt>
        <dd className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">{formatDate(record.issuedAt)}</dd>
      </div>
    </dl>
  );
}
