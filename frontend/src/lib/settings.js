import { isAddress, ZeroAddress } from 'ethers';

export function parseSettings(env = {}) {
  const contractAddress = (env.VITE_CONTRACT_ADDRESS || '').trim();
  const rpcUrl = (env.VITE_RPC_URL || '').trim();
  const chainId = (env.VITE_CHAIN_ID || '').trim();
  const explorerUrl = (env.VITE_EXPLORER_URL || '').trim().replace(/\/$/, '');
  const errors = [];
  if (!isAddress(contractAddress) || contractAddress.toLowerCase() === ZeroAddress) errors.push('Set VITE_CONTRACT_ADDRESS to your deployed registry address.');
  try {
    const url = new URL(rpcUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) throw new Error();
  } catch {
    errors.push('Set VITE_RPC_URL to a browser-accessible HTTPS Sepolia RPC URL.');
  }
  if (chainId !== '11155111') errors.push('Set VITE_CHAIN_ID to 11155111 (Sepolia only).');
  if (explorerUrl !== 'https://sepolia.etherscan.io') errors.push('Set VITE_EXPLORER_URL to https://sepolia.etherscan.io.');
  return {
    config: { contractAddress, rpcUrl, chainId: 11155111n, explorerUrl: 'https://sepolia.etherscan.io' },
    errors
  };
}
