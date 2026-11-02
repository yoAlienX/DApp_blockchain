import { useMemo } from 'react';
import { browserProvider, contract, readProvider } from '../lib/chain';

export function useContract({ writable = false } = {}) {
  return useMemo(() => (writable ? contract(browserProvider()) : contract(readProvider())), [writable]);
}
