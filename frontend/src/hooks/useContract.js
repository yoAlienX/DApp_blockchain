import { useCallback } from 'react';
import { readRegistry, writableRegistry } from '../lib/chain';
import { useWallet } from './useWallet';

export function useContract({ writable = false } = {}) {
  const { account } = useWallet();
  return useCallback(() => writable ? writableRegistry(account) : readRegistry(), [writable, account]);
}
