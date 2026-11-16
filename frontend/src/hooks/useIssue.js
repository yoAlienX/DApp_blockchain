import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { hashFile } from '../lib/hash';
import { documentRecord, friendlyError, readRegistry, writableRegistry, waitForTransaction } from '../lib/chain';
import { UserError } from '../lib/errors';
import { configErrors } from '../config';

export function useIssue({ account, wrongNetwork }) {
  const [access, setAccess] = useState({ account: '', status: 'idle', isOwner: false, error: '' });
  const [accessRevision, setAccessRevision] = useState(0);
  const [selection, setSelection] = useState({ file: null, hash: '', loading: false, error: '' });
  const [revokeHash, setRevokeHash] = useState('');
  const [revokeCheck, setRevokeCheck] = useState({ record: null, loading: false, error: '' });
  const [existingRecord, setExistingRecord] = useState(null);
  const [transaction, setTransaction] = useState({ operation: '', state: 'idle', hash: '', error: '' });
  const fileGeneration = useRef(0);
  const checkGeneration = useRef(0);
  const transactionLock = useRef(false);
  const mounted = useRef(true);
  const busy = ['checking', 'awaiting-signature', 'pending'].includes(transaction.state);
  const isIssuer = access.account === account && access.status === 'authorized' && !wrongNetwork;
  const isOwner = access.account === account && access.isOwner && !wrongNetwork;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; fileGeneration.current += 1; checkGeneration.current += 1; };
  }, []);

  useEffect(() => {
    let active = true;
    checkGeneration.current += 1;
    setRevokeCheck({ record: null, loading: false, error: '' });
    setExistingRecord(null);
    if (!account || wrongNetwork || configErrors.length) {
      setAccess({ account, status: 'idle', isOwner: false, error: '' });
      return undefined;
    }
    setAccess({ account, status: 'checking', isOwner: false, error: '' });
    (async () => {
      try {
        const registry = await readRegistry();
        const [authorized, ownerAddress] = await Promise.all([
          registry.isIssuer(account),
          registry.owner()
        ]);
        const ownsContract = ownerAddress.toLowerCase() === account.toLowerCase();
        if (active) setAccess({ account, status: authorized ? 'authorized' : 'denied', isOwner: ownsContract, error: '' });
      } catch (error) {
        if (active) setAccess({ account, status: 'error', isOwner: false, error: friendlyError(error) });
      }
    })();
    return () => { active = false; checkGeneration.current += 1; };
  }, [account, wrongNetwork, accessRevision]);

  const selectFile = async file => {
    if (!file || transactionLock.current) return;
    const request = ++fileGeneration.current;
    setSelection({ file, hash: '', loading: true, error: '' });
    setExistingRecord(null);
    setTransaction({ operation: '', state: 'idle', hash: '', error: '' });
    try {
      const hash = await hashFile(file);
      if (request === fileGeneration.current) setSelection({ file, hash, loading: false, error: '' });
    } catch (error) {
      if (request === fileGeneration.current) setSelection({ file, hash: '', loading: false, error: friendlyError(error) });
    }
  };

  const changeRevokeHash = value => {
    if (transactionLock.current) return;
    checkGeneration.current += 1;
    setRevokeHash(value.trim());
    setRevokeCheck({ record: null, loading: false, error: '' });
    setTransaction({ operation: '', state: 'idle', hash: '', error: '' });
  };

  const checkRevokeHash = async () => {
    const request = ++checkGeneration.current;
    setRevokeCheck({ record: null, loading: true, error: '' });
    try {
      if (!/^0x[\da-f]{64}$/i.test(revokeHash)) throw new UserError('Enter a 32-byte fingerprint: 0x followed by 64 hexadecimal characters.');
      const registry = await readRegistry();
      const record = documentRecord(await registry.verify(revokeHash));
      if (request === checkGeneration.current) setRevokeCheck({ record, loading: false, error: '' });
    } catch (error) {
      if (request === checkGeneration.current) setRevokeCheck({ record: null, loading: false, error: friendlyError(error) });
    }
  };

  const send = async (operation, hash) => {
    if (transactionLock.current || selection.loading) return;
    transactionLock.current = true;
    let txHash = '';
    const update = value => { if (mounted.current) setTransaction({ operation, ...value }); };
    update({ state: 'checking', hash: '', error: '' });
    try {
      if (!/^0x[\da-f]{64}$/i.test(hash)) throw new UserError('Choose a document or enter a valid fingerprint first.');
      const registry = await writableRegistry(account);
      const record = documentRecord(await registry.verify(hash));
      if (operation === 'issue') {
        if (!await registry.isIssuer(account)) throw new UserError('This wallet is not an authorized issuer. Ask the registry owner to add it.');
        if (record.exists) {
          if (mounted.current) setExistingRecord(record);
          throw new UserError('This exact document is already registered. The existing record is shown below.');
        }
      } else {
        if (!record.exists) throw new UserError('This document is not registered.');
        if (record.revoked) throw new UserError('This document is already revoked.');
        if (record.issuer.toLowerCase() !== account.toLowerCase()) throw new UserError('Only the original issuer can revoke this document.');
      }
      const currentRegistry = await writableRegistry(account);
      update({ state: 'awaiting-signature', hash: '', error: '' });
      const sent = await currentRegistry[operation](hash);
      txHash = sent.hash;
      update({ state: 'pending', hash: txHash, error: '' });
      const receipt = await waitForTransaction(sent);
      txHash = receipt.hash;
      update({ state: 'success', hash: txHash, error: '' });
      if (operation === 'revoke' && mounted.current) setRevokeCheck({ record: { ...record, revoked: true }, loading: false, error: '' });
    } catch (error) {
      update({ state: 'error', hash: txHash, error: friendlyError(error) });
    } finally {
      transactionLock.current = false;
    }
  };

  const selectRevokeFile = async file => {
    if (!file || transactionLock.current) return;
    const request = ++checkGeneration.current;
    setRevokeCheck({ record: null, loading: true, error: '' });
    setTransaction({ operation: '', state: 'idle', hash: '', error: '' });
    try {
      const hash = await hashFile(file);
      if (request !== checkGeneration.current) return;
      setRevokeHash(hash);
      const registry = await readRegistry();
      const record = documentRecord(await registry.verify(hash));
      if (request === checkGeneration.current) setRevokeCheck({ record, loading: false, error: '' });
    } catch (error) {
      if (request === checkGeneration.current) setRevokeCheck({ record: null, loading: false, error: friendlyError(error) });
    }
  };

  const manageIssuer = async (operation, targetAddress) => {
    if (transactionLock.current || selection.loading) return;
    transactionLock.current = true;
    let txHash = '';
    const update = value => { if (mounted.current) setTransaction({ operation, ...value }); };
    update({ state: 'checking', hash: '', error: '' });
    try {
      const candidate = (targetAddress || '').trim();
      if (!ethers.isAddress(candidate) || candidate.toLowerCase() === ethers.ZeroAddress) {
        throw new UserError('Enter a valid non-zero Ethereum address.');
      }
      const normalized = ethers.getAddress(candidate);
      const registry = await writableRegistry(account);
      const ownerAddress = await registry.owner();
      if (ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new UserError('Only the contract owner can manage authorized issuers.');
      }
      const currentlyAuthorized = await registry.isIssuer(normalized);
      if (operation === 'addIssuer' && currentlyAuthorized) {
        throw new UserError('This address is already an authorized issuer.');
      }
      if (operation === 'removeIssuer' && !currentlyAuthorized) {
        throw new UserError('This address is not currently an authorized issuer.');
      }
      update({ state: 'awaiting-signature', hash: '', error: '' });
      const sent = await registry[operation](normalized);
      txHash = sent.hash;
      update({ state: 'pending', hash: txHash, error: '' });
      const receipt = await waitForTransaction(sent);
      txHash = receipt.hash;
      update({ state: 'success', hash: txHash, error: '' });
      if (mounted.current && normalized.toLowerCase() === account.toLowerCase()) {
        setAccessRevision(value => value + 1);
      }
    } catch (error) {
      update({ state: 'error', hash: txHash, error: friendlyError(error) });
    } finally {
      transactionLock.current = false;
    }
  };

  const ownsRecord = Boolean(account && revokeCheck.record?.exists && revokeCheck.record.issuer.toLowerCase() === account.toLowerCase());
  return {
    access, isIssuer, isOwner, selection, selectFile, existingRecord, transaction, busy,
    revokeHash, changeRevokeHash, revokeCheck, checkRevokeHash, selectRevokeFile, ownsRecord,
    refreshAccess: () => setAccessRevision(value => value + 1),
    issue: () => send('issue', selection.hash),
    revoke: () => send('revoke', revokeHash),
    addIssuer: target => manageIssuer('addIssuer', target),
    removeIssuer: target => manageIssuer('removeIssuer', target)
  };
}
