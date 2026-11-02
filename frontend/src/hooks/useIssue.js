import { useCallback, useEffect, useState } from 'react';
import { hashFile } from '../lib/hash';
import { browserProvider, contract, friendlyError, readProvider } from '../lib/chain';

export function useIssue(account) {
  const [isIssuer, setIsIssuer] = useState(false); const [state, setState] = useState('idle'); const [file, setFile] = useState(null); const [hash, setHash] = useState(''); const [txHash, setTxHash] = useState(''); const [error, setError] = useState(''); const [revokeRecord, setRevokeRecord] = useState(null);
  useEffect(() => { let active = true; if (!account) { setIsIssuer(false); return undefined; } (async () => { try { const value = await contract(browserProvider()).isIssuer(account); if (active) setIsIssuer(value); } catch (value) { if (active) setError(friendlyError(value)); } })(); return () => { active = false; }; }, [account]);
  const selectFile = useCallback(async (nextFile) => { setFile(nextFile); setHash(''); setError(''); if (!nextFile) return; setState('hashing'); try { setHash(await hashFile(nextFile)); setState('idle'); } catch (value) { setState('error'); setError(friendlyError(value)); } }, []);
  const checkRevokeHash = useCallback(async (value) => { setRevokeRecord(null); if (!/^0x[a-fA-F0-9]{64}$/.test(value)) return; try { const result = await contract(readProvider()).verify(value); setRevokeRecord({ exists: result.exists, issuer: result.issuer, ownedByAccount: result.exists && result.issuer.toLowerCase() === account?.toLowerCase(), revoked: result.revoked }); } catch (valueError) { setError(friendlyError(valueError)); } }, [account]);
  const send = useCallback(async (method, value) => { if (!value) return; setError(''); setTxHash(''); setState('awaiting-signature'); try { const transaction = await contract(await browserProvider().getSigner())[method](value); setTxHash(transaction.hash); setState('pending'); await transaction.wait(); setState('success'); } catch (errorValue) { setState('error'); setError(friendlyError(errorValue)); } }, []);
  return { isIssuer, state, file, hash, txHash, error, revokeRecord, selectFile, checkRevokeHash, issue: () => send('issue', hash), revoke: (revokeHash) => send('revoke', revokeHash) };
}
