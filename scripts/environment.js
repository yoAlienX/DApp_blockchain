const { ethers } = require('ethers');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class SetupError extends Error {}

function address(value, label) {
  if (!value || !ethers.isAddress(value) || value.toLowerCase() === ethers.ZeroAddress) throw new SetupError(`Set ${label} to a valid non-zero address in the root .env.`);
  return ethers.getAddress(value);
}

function settings({ registry = false } = {}) {
  const rpcUrl = process.env.SEPOLIA_RPC_URL?.trim();
  try {
    const url = new URL(rpcUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch {
    throw new SetupError('Set SEPOLIA_RPC_URL to an HTTPS Sepolia endpoint in the root .env.');
  }
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!/^0x[\da-f]{64}$/i.test(privateKey || '')) throw new SetupError('Set DEPLOYER_PRIVATE_KEY to your test-only wallet key (0x plus 64 hexadecimal characters) in the root .env. Never share it.');
  try { new ethers.Wallet(privateKey); } catch { throw new SetupError('The test-wallet private key is not valid. Check it locally; do not share it.'); }
  return {
    rpcUrl, privateKey,
    contractAddress: registry ? address(process.env.CONTRACT_ADDRESS?.trim(), 'CONTRACT_ADDRESS') : undefined,
    issuerAddress: registry ? address(process.env.ISSUER_ADDRESS?.trim(), 'ISSUER_ADDRESS') : undefined
  };
}

async function assertSepolia(provider) {
  if ((await provider.getNetwork()).chainId !== 11155111n) throw new SetupError('Refusing to continue: the RPC is not Sepolia (chain ID 11155111).');
}

function reportError(error) {
  const messages = {
    INSUFFICIENT_FUNDS: 'Not enough Sepolia test ETH for this transaction.',
    NONCE_EXPIRED: 'Wallet nonce changed. Inspect pending transactions before retrying.',
    TIMEOUT: 'RPC timed out. Check your provider; inspect any submitted transaction before retrying.'
  };
  console.error(error instanceof SetupError ? error.message : messages[error.code] || 'Blockchain operation failed. Check RPC access, wallet balance, owner permissions, and transaction status. Raw errors are hidden to protect RPC credentials.');
  process.exitCode = 1;
}

module.exports = { settings, assertSepolia, reportError, SetupError };
