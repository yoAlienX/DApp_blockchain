import { useEffect, useRef, useState } from 'react';
import { hashFile } from '../lib/hash';
import { documentRecord, friendlyError, readRegistry } from '../lib/chain';
import { UserError } from '../lib/errors';
import { recordVerificationOp } from '../lib/usageStats';

export function useVerify() {
  const [state, setState] = useState({ file: null, hash: '', result: null, loading: false, error: '' });
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  const verifyFile = async (file) => {
    if (!file) return;
    const request = ++generation.current;
    let hash = '';
    setState({ file, hash: '', result: null, loading: true, error: '' });
    try {
      hash = await hashFile(file);
      if (request !== generation.current) return;
      setState(previous => ({ ...previous, hash }));
      const registry = await readRegistry();
      const result = documentRecord(await registry.verify(hash));
      recordVerificationOp();
      if (request === generation.current) setState({ file, hash, result, loading: false, error: '' });
    } catch (error) {
      if (request === generation.current) setState({ file, hash, result: null, loading: false, error: friendlyError(error) });
    }
  };

  const verifyHash = async (rawHash) => {
    const hash = (rawHash || '').trim();
    const request = ++generation.current;
    setState({ file: null, hash, result: null, loading: true, error: '' });
    try {
      if (!/^0x[\da-f]{64}$/i.test(hash)) {
        throw new UserError('Enter a valid 32-byte SHA-256 fingerprint: 0x followed by 64 hexadecimal characters.');
      }
      const registry = await readRegistry();
      const result = documentRecord(await registry.verify(hash));
      recordVerificationOp();
      if (request === generation.current) setState({ file: null, hash, result, loading: false, error: '' });
    } catch (error) {
      if (request === generation.current) setState({ file: null, hash, result: null, loading: false, error: friendlyError(error) });
    }
  };

  const reset = () => {
    generation.current += 1;
    setState({ file: null, hash: '', result: null, loading: false, error: '' });
  };

  return { ...state, verifyFile, verifyHash, reset };
}
