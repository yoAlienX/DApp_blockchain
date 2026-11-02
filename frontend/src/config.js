export const config = {
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  rpcUrl: import.meta.env.VITE_RPC_URL || '',
  chainId: BigInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://sepolia.etherscan.io'
};
export function requireConfig() { if (!config.contractAddress || !config.rpcUrl) throw new Error('Add the Sepolia contract address and RPC URL to frontend/.env.'); return config; }
