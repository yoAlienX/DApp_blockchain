import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from '../abi/DocChainRegistry.json';
import { config } from '../config';
import { friendlyError, readProvider, readRegistry } from '../lib/chain';
import { queryRecentEvents } from '../lib/activity';

const SEPOLIA_LOG_FALLBACK_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

function isRemoteSepolia() {
  try {
    const host = new URL(config.rpcUrl).hostname;
    return config.chainId === 11155111n && !['127.0.0.1', 'localhost'].includes(host);
  } catch {
    return false;
  }
}

export function useActivity() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setProgress(0);
    (async () => {
      let fallbackProvider;
      try {
        const registry = await readRegistry();
        const latest = await readProvider().getBlockNumber();
        try {
          const result = await queryRecentEvents(registry, latest, { signal: controller.signal, onProgress: setProgress });
          if (!controller.signal.aborted) setEvents(result);
        } catch (err) {
          if (err?.code === 'FREE_TIER_LOG_LIMIT' && isRemoteSepolia()) {
            const req = new ethers.FetchRequest(SEPOLIA_LOG_FALLBACK_RPC);
            req.timeout = 15000;
            fallbackProvider = new ethers.JsonRpcProvider(req, undefined, { batchMaxCount: 1 });
            const fallbackRegistry = new ethers.Contract(config.contractAddress, abi, fallbackProvider);
            const fallbackLatest = await fallbackProvider.getBlockNumber();
            const result = await queryRecentEvents(fallbackRegistry, fallbackLatest, { signal: controller.signal, onProgress: setProgress });
            if (!controller.signal.aborted) setEvents(result);
          } else {
            throw err;
          }
        }
      } catch (value) {
        if (!controller.signal.aborted) setError(friendlyError(value));
      } finally {
        fallbackProvider?.destroy?.();
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [revision]);

  return { events, loading, error, progress, refresh: () => setRevision(value => value + 1) };
}
