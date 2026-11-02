import { useEffect, useState } from 'react';
import { contract, friendlyError, readProvider } from '../lib/chain';

export function useActivity() {
  const [events, setEvents] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let active = true; (async () => { try { const provider = readProvider(); const registry = contract(provider); const latest = await provider.getBlockNumber(); const fromBlock = Math.max(0, latest - 5000); const [issued, revoked] = await Promise.all([registry.queryFilter(registry.filters.DocumentIssued(), fromBlock, latest), registry.queryFilter(registry.filters.DocumentRevoked(), fromBlock, latest)]); const mapped = [...issued.map(event => ({ type: 'Issued', hash: event.args.docHash, issuer: event.args.issuer, block: event.blockNumber, tx: event.transactionHash })), ...revoked.map(event => ({ type: 'Revoked', hash: event.args.docHash, issuer: event.args.issuer, block: event.blockNumber, tx: event.transactionHash }))].sort((a, b) => b.block - a.block); if (active) setEvents(mapped); } catch (value) { if (active) setError(friendlyError(value)); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, []);
  return { events, loading, error };
}
