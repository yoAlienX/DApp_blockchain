import { ethers } from 'ethers';
import abi from '../abi/DocChainRegistry.json';
import { config, configErrors } from '../config.js';
import { readProvider, readRegistry } from './chain.js';
import { queryRecentEvents } from './activity.js';
export { buildCumulativeSeries } from './usageSeries.js';

const VERIFY_OPS_KEY = 'sealmark_verifications_v1';
const SEPOLIA_LOG_FALLBACK_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

function isRemoteSepolia() {
  try {
    const host = new URL(config.rpcUrl).hostname;
    return config.chainId === 11155111n && !['127.0.0.1', 'localhost'].includes(host);
  } catch {
    return false;
  }
}

export function loadVerificationOps() {
  try {
    const raw = window.localStorage.getItem(VERIFY_OPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && typeof item.at === 'number' && Number.isFinite(item.at))
      .map(item => ({ type: 'Verified', at: item.at }));
  } catch {
    return [];
  }
}

export function recordVerificationOp() {
  try {
    const existing = loadVerificationOps();
    const next = [...existing, { type: 'Verified', at: Math.floor(Date.now() / 1000) }].slice(-500);
    window.localStorage.setItem(VERIFY_OPS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchOnChainOps({ signal } = {}) {
  if (configErrors.length) return [];
  let fallbackProvider;
  try {
    const registry = await readRegistry();
    const latest = await readProvider().getBlockNumber();
    try {
      return await queryRecentEvents(registry, latest, { signal });
    } catch (err) {
      if (err?.code === 'FREE_TIER_LOG_LIMIT' && isRemoteSepolia()) {
        const req = new ethers.FetchRequest(SEPOLIA_LOG_FALLBACK_RPC);
        req.timeout = 15000;
        fallbackProvider = new ethers.JsonRpcProvider(req, undefined, { batchMaxCount: 1 });
        const fallbackRegistry = new ethers.Contract(config.contractAddress, abi, fallbackProvider);
        const fallbackLatest = await fallbackProvider.getBlockNumber();
        return await queryRecentEvents(fallbackRegistry, fallbackLatest, { chunkSize: 2500, signal });
      }
      return [];
    }
  } catch {
    return [];
  } finally {
    fallbackProvider?.destroy?.();
  }
}
