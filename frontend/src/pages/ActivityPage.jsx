import { useMemo, useState } from 'react';
import { History, RefreshCw, Search, ExternalLink } from 'lucide-react';
import { useActivity } from '../hooks/useActivity';
import { config, configErrors } from '../config';
import { EmptyState, InlineError, LoadingSkeleton, Spinner, StatusBadge, TxLink, formatDate } from '../components';

export default function ActivityPage() {
  const activity = useActivity();
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activity.events.filter(event => {
      if (filter !== 'All' && event.type !== filter) return false;
      if (!q) return true;
      return event.hash.toLowerCase().includes(q) || event.issuer.toLowerCase().includes(q) || event.tx.toLowerCase().includes(q);
    });
  }, [activity.events, filter, query]);

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Registry Audit Log</p>
        <h1 className="mt-2">Recent on-chain activity</h1>
        <p className="lead">
          Issuance and revocation events read directly from the Sepolia smart contract over the latest 5,000 blocks, ordered newest first.
        </p>
      </div>

      <section className="card min-w-0" aria-labelledby="activity-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="text-indigo-600" size={20} aria-hidden="true" />
            <h2 id="activity-title">Event feed</h2>
          </div>

          <button
            onClick={() => { setLimit(20); activity.refresh(); }}
            disabled={activity.loading || configErrors.length > 0}
            className="button-secondary"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {!activity.loading && !activity.error && activity.events.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800" role="group" aria-label="Filter events by type">
              {['All', 'Issued', 'Revoked'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setFilter(type); setLimit(20); }}
                  className={`rounded-md px-3 py-1.5 transition-colors ${filter === type ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 sm:w-72">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Filter by hash, issuer, or tx…"
                aria-label="Filter events"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        )}

        {activity.loading ? (
          <div className="mt-6 space-y-5">
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Spinner />
              Reading activity… {activity.progress.toLocaleString()} blocks checked
            </p>
            <LoadingSkeleton />
          </div>
        ) : activity.error ? (
          <InlineError>{activity.error}</InlineError>
        ) : !activity.events.length ? (
          <div className="mt-6">
            <EmptyState>
              No events found in the latest 5,000 blocks. Older records remain verifiable by selecting the original document on the Verify page.
            </EmptyState>
          </div>
        ) : !filteredEvents.length ? (
          <div className="mt-6">
            <EmptyState>No events match your current filter.</EmptyState>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </p>
            <ol className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEvents.slice(0, limit).map(event => (
                <li key={`${event.tx}-${event.index}`} className="min-w-0 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge kind={event.type === 'Issued' ? 'verified' : 'revoked'}>
                      {event.type}
                    </StatusBadge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(event.timestamp)} · Block {event.block.toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                    {event.hash}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="break-all">
                      Issuer:{' '}
                      <a
                        href={`${config.explorerUrl}/address/${event.issuer}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:decoration-indigo-700 dark:hover:text-indigo-300"
                      >
                        {event.issuer}
                        <ExternalLink size={11} aria-hidden="true" />
                      </a>
                    </span>
                    <span className="text-xs">
                      <TxLink hash={event.tx} />
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            {limit < filteredEvents.length && (
              <button className="button-secondary mt-4" onClick={() => setLimit(value => value + 20)}>
                Show more
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}
