export async function queryRecentEvents(registry, latest, { windowSize = 5000, chunkSize = 500, signal, onProgress = () => {} } = {}) {
  const firstBlock = Math.max(0, latest - windowSize + 1);
  const events = [];
  async function queryRange(fromBlock, toBlock) {
    signal?.throwIfAborted();
    try {
      return await registry.queryFilter('*', fromBlock, toBlock);
    } catch (error) {
      signal?.throwIfAborted();
      const message = `${error?.shortMessage || ''} ${error?.message || ''} ${error?.info?.error?.message || ''} ${error?.info?.responseBody || ''}`;
      if (/up to a \d+ block range/i.test(message) && toBlock - fromBlock > 20) {
        const rangeError = new Error(message);
        rangeError.code = 'FREE_TIER_LOG_LIMIT';
        throw rangeError;
      }
      const rangeLimit = /block range|too many results|response size|query returned more|limited to.*blocks|maximum.*blocks|exceed.*range/i.test(message);
      if (!rangeLimit || fromBlock === toBlock) throw error;
      const midpoint = Math.floor((fromBlock + toBlock) / 2);
      return [...await queryRange(fromBlock, midpoint), ...await queryRange(midpoint + 1, toBlock)];
    }
  }
  for (let toBlock = latest; toBlock >= firstBlock; toBlock -= chunkSize) {
    const fromBlock = Math.max(firstBlock, toBlock - chunkSize + 1);
    for (const event of await queryRange(fromBlock, toBlock)) {
      const name = event.fragment?.name;
      if (name !== 'DocumentIssued' && name !== 'DocumentRevoked') continue;
      events.push({
        type: name === 'DocumentIssued' ? 'Issued' : 'Revoked', hash: event.args.docHash,
        issuer: event.args.issuer, timestamp: Number(event.args.issuedAt ?? event.args.revokedAt),
        block: event.blockNumber, index: event.index, tx: event.transactionHash
      });
    }
    signal?.throwIfAborted();
    onProgress(latest - fromBlock + 1);
  }
  return events.sort((first, second) => second.block - first.block || second.index - first.index);
}
