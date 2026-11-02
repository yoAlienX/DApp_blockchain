import { useState } from 'react';
import { hashFile } from '../lib/hash';
import { contract, friendlyError, readProvider } from '../lib/chain';

export function useVerify() {
  const [state, setState] = useState({ file: null, hash: '', result: null, loading: false, error: '' });
  const verifyFile = async (file) => {
    if (!file) return;
    setState({ file, hash: '', result: null, loading: true, error: '' });
    try {
      const hash = await hashFile(file); const value = await contract(readProvider()).verify(hash);
      setState({ file, hash, result: { exists: value.exists, revoked: value.revoked, issuer: value.issuer, issuedAt: Number(value.issuedAt) }, loading: false, error: '' });
    } catch (error) { setState({ file, hash: '', result: null, loading: false, error: friendlyError(error) }); }
  };
  return { ...state, verifyFile };
}
