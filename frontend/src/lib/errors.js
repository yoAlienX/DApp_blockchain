export class UserError extends Error {}

const contractErrors = {
  AlreadyIssued: 'This exact document is already registered. Check its existing record on Verify.',
  NotIssuer: 'This wallet is not an authorized issuer. Ask the registry owner to add it.',
  NotOwner: 'Only the registry owner can manage issuers.',
  NotIssuedByCaller: 'Only the original issuer can revoke this document.',
  AlreadyRevoked: 'This document is already revoked.',
  NotFound: 'This document is not registered.',
  ZeroHash: 'A zero fingerprint cannot be registered.',
  ZeroAddress: 'The zero address is not a valid issuer.'
};

export function friendlyError(error) {
  if (error instanceof UserError) return error.message;
  const nested = error?.info?.error || error?.error || error?.cause;
  const codes = [error?.code, nested?.code, nested?.data?.originalError?.code];
  if (codes.includes(4001) || codes.includes('ACTION_REJECTED')) return 'Transaction cancelled in wallet.';
  if (codes.includes(-32002)) return 'A wallet request is already pending. Open MetaMask to continue.';
  if (codes.includes('INSUFFICIENT_FUNDS')) return 'Not enough Sepolia test ETH to pay gas. Fund this test wallet and retry.';
  if (codes.includes('TIMEOUT')) return 'The Sepolia RPC timed out. Try again or check your RPC provider.';
  if (codes.includes(4900) || codes.includes(4901) || codes.includes('NETWORK_ERROR')) return 'The blockchain connection changed or is unavailable. Check Sepolia and retry.';
  if (codes.includes('TRANSACTION_REPLACED')) return 'The transaction was cancelled or replaced in your wallet. Check its status before retrying.';
  const name = error?.revert?.name || nested?.revert?.name;
  if (contractErrors[name]) return contractErrors[name];
  if (codes.includes('BAD_DATA')) return 'The registry did not return valid data. Check the deployed contract address and RPC network.';
  return 'The blockchain request failed. Check your connection, Sepolia RPC settings, and provider limits, then retry.';
}
