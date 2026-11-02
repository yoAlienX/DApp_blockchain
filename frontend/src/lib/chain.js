import { ethers } from 'ethers';
import abi from '../abi/DocChainRegistry.json';
import { config, requireConfig } from '../config';
export function readProvider() { return new ethers.JsonRpcProvider(requireConfig().rpcUrl); }
export function browserProvider() { if (!window.ethereum) throw new Error('MetaMask is required for issuer actions.'); return new ethers.BrowserProvider(window.ethereum); }
export function contract(runner) { return new ethers.Contract(requireConfig().contractAddress, abi, runner); }
export async function ensureSepolia(provider) {
  const network = await provider.getNetwork();
  if (network.chainId === config.chainId) return true;
  await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
  return true;
}
export function friendlyError(error) { if (error?.code === 4001) return 'Transaction cancelled in wallet.'; if (error?.code === -32002) return 'A wallet request is already pending.'; const name = error?.revert?.name || error?.shortMessage || ''; const map = { AlreadyIssued: 'This document is already registered.', NotIssuer: 'This wallet is not an authorized issuer.', NotIssuedByCaller: 'Only the original issuer can revoke this document.', AlreadyRevoked: 'This document is already revoked.', NotFound: 'This document is not registered.' }; return map[name] || name || 'The blockchain request failed. Check your network and try again.'; }
