import { useCallback, useEffect, useState } from 'react';
import { browserProvider, ensureSepolia, friendlyError } from '../lib/chain';
import { config } from '../config';
export function useWallet() {
  const [account,setAccount]=useState(''); const [chainId,setChainId]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const refresh=useCallback(async()=>{ if(!window.ethereum)return; const accounts=await window.ethereum.request({method:'eth_accounts'}); setAccount(accounts[0]||''); const id=await window.ethereum.request({method:'eth_chainId'}); setChainId(BigInt(id)); },[]);
  useEffect(()=>{ refresh().catch(error => setError(friendlyError(error))); if(!window.ethereum)return; const a=()=>refresh().catch(error => setError(friendlyError(error))); const c=()=>refresh().catch(error => setError(friendlyError(error))); window.ethereum.on('accountsChanged',a); window.ethereum.on('chainChanged',c); return()=>{window.ethereum.removeListener('accountsChanged',a);window.ethereum.removeListener('chainChanged',c);}; },[refresh]);
  const connect=async()=>{setLoading(true);setError('');try{const p=browserProvider();await p.send('eth_requestAccounts',[]);await ensureSepolia(p);await refresh();}catch(e){setError(friendlyError(e));}finally{setLoading(false);}};
  const disconnect=()=>{setAccount('');setError('');};
  return {account,chainId,loading,error,connect,disconnect,wrongNetwork:!!account&&chainId!==config.chainId};
}
