import { ethers } from 'ethers';
import abi from '../abi/DocChainRegistry.json';
import { config, requireConfig } from '../config';
import { UserError } from './errors';

export { friendlyError } from './errors';

let publicProvider;
let registryCheck;

export function readProvider() {
  requireConfig();
  if (!publicProvider) {
    const request = new ethers.FetchRequest(config.rpcUrl);
    request.timeout = 15000;
    publicProvider = new ethers.JsonRpcProvider(request, undefined, { batchMaxCount: 1 });
  }
  return publicProvider;
}

export function browserProvider() {
  if (!window.ethereum) throw new UserError('MetaMask is required for issuer actions. Verification does not need a wallet.');
  return new ethers.BrowserProvider(window.ethereum);
}

export function contract(runner) {
  return new ethers.Contract(requireConfig().contractAddress, abi, runner);
}

export async function readRegistry() {
  const provider = readProvider();
  if (!registryCheck) {
    registryCheck = (async () => {
      if ((await provider.getNetwork()).chainId !== config.chainId) throw new UserError('The configured RPC is not on Sepolia. Correct VITE_RPC_URL and restart the app.');
      if (await provider.getCode(config.contractAddress) === '0x') throw new UserError('No contract exists at this Sepolia address. Check VITE_CONTRACT_ADDRESS.');
    })().catch(error => { registryCheck = undefined; throw error; });
  }
  await registryCheck;
  return contract(provider);
}

export async function ensureSepolia() {
  browserProvider();
  const chainId = `0x${config.chainId.toString(16)}`;
  if (BigInt(await window.ethereum.request({ method: 'eth_chainId' })) === config.chainId) return;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (error) {
    if (![error?.code, error?.data?.originalError?.code].includes(4902)) throw error;
    requireConfig();
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
      chainId, chainName: 'Sepolia', nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: [config.rpcUrl], blockExplorerUrls: [config.explorerUrl]
    }] });
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  }
  if (BigInt(await window.ethereum.request({ method: 'eth_chainId' })) !== config.chainId) throw new UserError('Switch your wallet to Sepolia before continuing.');
}

export async function writableRegistry(expectedAccount) {
  if (!expectedAccount) throw new UserError('Connect your issuer wallet first.');
  const provider = browserProvider();
  if (BigInt(await window.ethereum.request({ method: 'eth_chainId' })) !== config.chainId) throw new UserError('Switch your wallet to Sepolia before submitting a transaction.');
  await readRegistry();
  const signer = await provider.getSigner();
  if ((await signer.getAddress()).toLowerCase() !== expectedAccount.toLowerCase()) throw new UserError('The wallet account changed. Review the document and try again.');
  if ((await provider.getNetwork()).chainId !== config.chainId) throw new UserError('The wallet network changed. Switch to Sepolia and retry.');
  return contract(signer);
}

export async function waitForTransaction(transaction) {
  try {
    const receipt = await transaction.wait(1);
    if (!receipt || receipt.status !== 1) throw new UserError('The transaction failed on-chain. Check its explorer link.');
    return receipt;
  } catch (error) {
    if (error.code === 'TRANSACTION_REPLACED' && !error.cancelled && error.reason === 'repriced' && error.receipt?.status === 1) return error.receipt;
    throw error;
  }
}

export function documentRecord(value) {
  return { exists: value.exists, revoked: value.revoked, issuer: value.issuer, issuedAt: Number(value.issuedAt) };
}
