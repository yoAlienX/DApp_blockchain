import test from 'node:test';
import assert from 'node:assert/strict';
import { hashFile, MAX_FILE_SIZE } from '../src/lib/hash.js';
import { friendlyError, UserError } from '../src/lib/errors.js';
import { parseSettings } from '../src/lib/settings.js';
import { queryRecentEvents } from '../src/lib/activity.js';
import { hashPassword, verifyPassword, isSafeRasterDataUrl } from '../src/lib/authStorage.js';
import { buildCumulativeSeries } from '../src/lib/usageSeries.js';

test('SHA-256 uses document bytes, not filename, and detects single-byte changes', async () => {
  const original = new File(['abc'], 'original.txt');
  const renamed = new File(['abc'], 'renamed.txt');
  const altered = new File(['abd'], 'original.txt');
  assert.equal(await hashFile(original), '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hashFile(original), await hashFile(renamed));
  assert.notEqual(await hashFile(original), await hashFile(altered));
});

test('empty files are valid and absent files explain the action required', async () => {
  assert.equal(await hashFile(new File([], 'empty.txt')), '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  await assert.rejects(hashFile(null), /Choose a file first/);
  await assert.rejects(hashFile({ size: 1, async arrayBuffer() { throw new Error('NotReadableError'); } }), /file could not be read/);
});

test('25 MB boundary is inclusive and larger files are never read', async () => {
  let read = false;
  await assert.rejects(hashFile({ size: MAX_FILE_SIZE + 1, arrayBuffer() { read = true; } }), /25 MB/);
  assert.equal(read, false);
  assert.match(await hashFile(new File([new Uint8Array(MAX_FILE_SIZE)], 'limit.bin')), /^0x[0-9a-f]{64}$/);
});

test('friendly errors handle ethers v6 and nested wallet codes', () => {
  for (const error of [{ code: 4001 }, { code: 'ACTION_REJECTED' }, { info: { error: { code: 4001 } } }]) assert.equal(friendlyError(error), 'Transaction cancelled in wallet.');
  assert.match(friendlyError({ code: -32002 }), /already pending/);
  assert.match(friendlyError({ code: 'INSUFFICIENT_FUNDS' }), /test ETH/);
  assert.match(friendlyError({ revert: { name: 'NotIssuedByCaller' } }), /original issuer/);
  assert.equal(friendlyError(new UserError('Files must be 25 MB or smaller.')), 'Files must be 25 MB or smaller.');
});

test('raw RPC URLs and unexpected errors are not displayed', () => {
  const message = friendlyError({ shortMessage: 'https://example.com/private-api-key', message: 'secret', stack: 'secret' });
  assert.doesNotMatch(message, /private-api-key|secret/);
});

const validSettings = {
  VITE_CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111',
  VITE_RPC_URL: 'https://rpc.example.invalid', VITE_CHAIN_ID: '11155111',
  VITE_EXPLORER_URL: 'https://sepolia.etherscan.io'
};

test('configuration validates all public settings without startup crashes', () => {
  assert.deepEqual(parseSettings(validSettings).errors, []);
  assert.equal(parseSettings({}).errors.length, 4);
  assert.equal(parseSettings({ ...validSettings, VITE_CHAIN_ID: 'not-a-number' }).errors.length, 1);
  assert.equal(parseSettings({ ...validSettings, VITE_CHAIN_ID: '1' }).errors.length, 1);
  assert.equal(parseSettings({ ...validSettings, VITE_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000' }).errors.length, 1);
  assert.equal(parseSettings({ ...validSettings, VITE_RPC_URL: 'http://public.example.com' }).errors.length, 1);
  assert.equal(parseSettings({ ...validSettings, VITE_EXPLORER_URL: 'javascript:alert(1)' }).errors.length, 1);
});

test('activity scans exactly 5000 blocks without overlaps and filters issuer events', async () => {
  const ranges = [];
  const registry = { async queryFilter(filter, fromBlock, toBlock) {
    assert.equal(filter, '*');
    ranges.push([fromBlock, toBlock]);
    return [{ fragment: { name: 'IssuerAdded' } }];
  } };
  assert.deepEqual(await queryRecentEvents(registry, 6000), []);
  assert.equal(ranges.length, 10);
  assert.deepEqual(ranges[0], [5501, 6000]);
  assert.deepEqual(ranges.at(-1), [1001, 1500]);
  assert.equal(ranges.reduce((total, [start, end]) => total + end - start + 1, 0), 5000);
});

test('activity subdivides provider-limited ranges and orders same-block events', async () => {
  const registry = { async queryFilter(filter, fromBlock, toBlock) {
    if (toBlock - fromBlock > 1) throw new Error('block range limit exceeded');
    return [0, 1].map(index => ({ fragment: { name: index ? 'DocumentRevoked' : 'DocumentIssued' }, args: { docHash: 'hash', issuer: 'issuer', issuedAt: 1n }, blockNumber: toBlock, index, transactionHash: `tx-${toBlock}` }));
  } };
  const events = await queryRecentEvents(registry, 3);
  assert.equal(events.length, 4);
  assert.deepEqual(events.map(event => [event.block, event.index]), [[3, 1], [3, 0], [1, 1], [1, 0]]);
});

test('activity stops on cancellation and does not split authentication failures', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(queryRecentEvents({}, 100, { signal: controller.signal }), { name: 'AbortError' });
  let calls = 0;
  await assert.rejects(queryRecentEvents({ async queryFilter() { calls += 1; throw new Error('401 unauthorized'); } }, 100), /401/);
  assert.equal(calls, 1);
});

test('PBKDF2 password hashing uses unique salts and verifies accurately', async () => {
  const hashA = await hashPassword('StrongPass!99');
  const hashB = await hashPassword('StrongPass!99');
  assert.match(hashA, /^pbkdf2\$[\da-f]{32}\$[\da-f]{64}$/);
  assert.notEqual(hashA, hashB);
  assert.equal(await verifyPassword('StrongPass!99', hashA), true);
  assert.equal(await verifyPassword('WrongPass!99', hashA), false);
});

test('avatar image validator rejects SVG, HTML, and remote URLs', () => {
  assert.equal(isSafeRasterDataUrl('data:image/png;base64,iVBORw0KGgo='), true);
  assert.equal(isSafeRasterDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isSafeRasterDataUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRasterDataUrl('https://evil.example/track.png'), false);
});

test('usage chart series computes real combined operations from 0 to total', () => {
  const empty = buildCumulativeSeries([], []);
  assert.equal(empty.totalOps, 0);
  assert.deepEqual(empty.series.map(p => p.value), [0]);

  const combined = buildCumulativeSeries(
    [{ type: 'Issued', timestamp: 100 }, { type: 'Revoked', timestamp: 300 }],
    [{ type: 'Verified', at: 200 }]
  );
  assert.equal(combined.totalOps, 3);
  assert.equal(combined.issuedCount, 1);
  assert.equal(combined.revokedCount, 1);
  assert.equal(combined.verifiedCount, 1);
  assert.deepEqual(combined.series.map(p => p.value), [0, 1, 2, 3]);
});
