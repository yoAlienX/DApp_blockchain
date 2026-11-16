import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { browserProvider, ensureSepolia, friendlyError, readRegistry } from '../lib/chain';
import { config, configErrors } from '../config';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleState, setRoleState] = useState({ role: 'guest', isOwner: false, isIssuer: false, checking: false });
  const [signatureAuth, setSignatureAuth] = useState({ account: '', verified: false, signing: false, error: '' });
  const disconnected = useRef(false);
  const generation = useRef(0);
  const connecting = useRef(false);

  const refresh = useCallback(async () => {
    if (!window.ethereum || disconnected.current) return;
    const request = ++generation.current;
    const [accounts, network] = await Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }),
      window.ethereum.request({ method: 'eth_chainId' })
    ]);
    if (request !== generation.current || disconnected.current) return;
    const nextAccount = accounts[0] || '';
    setAccount(nextAccount);
    setChainId(BigInt(network));
    if (!nextAccount) {
      setSignatureAuth({ account: '', verified: false, signing: false, error: '' });
    }
  }, []);

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return undefined;
    const sync = () => refresh().catch(value => setError(friendlyError(value)));
    const lostConnection = () => {
      generation.current += 1;
      setAccount('');
      setChainId(null);
      setRoleState({ role: 'guest', isOwner: false, isIssuer: false, checking: false });
      setSignatureAuth({ account: '', verified: false, signing: false, error: '' });
    };
    sync();
    provider.on?.('accountsChanged', sync);
    provider.on?.('chainChanged', sync);
    provider.on?.('disconnect', lostConnection);
    return () => {
      generation.current += 1;
      provider.removeListener?.('accountsChanged', sync);
      provider.removeListener?.('chainChanged', sync);
      provider.removeListener?.('disconnect', lostConnection);
    };
  }, [refresh]);

  const wrongNetwork = Boolean(account) && chainId !== config.chainId;

  useEffect(() => {
    let active = true;
    if (!account) {
      setRoleState({ role: 'guest', isOwner: false, isIssuer: false, checking: false });
      return undefined;
    }
    if (wrongNetwork || configErrors.length) {
      setRoleState({ role: 'user', isOwner: false, isIssuer: false, checking: false });
      return undefined;
    }
    setRoleState(prev => ({ ...prev, checking: true }));
    (async () => {
      try {
        const registry = await readRegistry();
        const [isIssuer, ownerAddress] = await Promise.all([
          registry.isIssuer(account),
          registry.owner()
        ]);
        const isOwner = ownerAddress.toLowerCase() === account.toLowerCase();
        const role = isOwner ? 'admin' : isIssuer ? 'issuer' : 'user';
        if (active) setRoleState({ role, isOwner, isIssuer, checking: false });
      } catch {
        if (active) setRoleState({ role: 'user', isOwner: false, isIssuer: false, checking: false });
      }
    })();
    return () => { active = false; };
  }, [account, wrongNetwork]);

  const connect = async () => {
    if (connecting.current) return;
    connecting.current = true;
    setLoading(true);
    setError('');
    disconnected.current = false;
    try {
      browserProvider();
      if (!account) await window.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureSepolia();
      await refresh();
    } catch (value) {
      setError(friendlyError(value));
      await refresh().catch(() => {});
    } finally {
      connecting.current = false;
      setLoading(false);
    }
  };

  const authenticateSession = async () => {
    if (!account || wrongNetwork) return;
    setSignatureAuth({ account, verified: false, signing: true, error: '' });
    try {
      const provider = browserProvider();
      const signer = await provider.getSigner();
      const message = `DocChain Session Sign-In\nAddress: ${account}\nNetwork: Sepolia (${config.chainId.toString()})\nTimestamp: ${new Date().toISOString()}`;
      await signer.signMessage(message);
      setSignatureAuth({ account, verified: true, signing: false, error: '' });
    } catch (value) {
      setSignatureAuth({ account, verified: false, signing: false, error: friendlyError(value) });
    }
  };

  const disconnect = () => {
    disconnected.current = true;
    generation.current += 1;
    setAccount('');
    setChainId(null);
    setError('');
    setRoleState({ role: 'guest', isOwner: false, isIssuer: false, checking: false });
    setSignatureAuth({ account: '', verified: false, signing: false, error: '' });
  };

  const isAuthenticated = Boolean(account && signatureAuth.verified && signatureAuth.account.toLowerCase() === account.toLowerCase());

  const value = {
    account,
    chainId,
    loading,
    error,
    connect,
    disconnect,
    wrongNetwork,
    role: roleState.role,
    isOwner: roleState.isOwner,
    isIssuer: roleState.isIssuer,
    roleChecking: roleState.checking,
    isAuthenticated,
    signingAuth: signatureAuth.signing,
    authError: signatureAuth.error,
    authenticateSession
  };
  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet requires WalletProvider.');
  return wallet;
}
