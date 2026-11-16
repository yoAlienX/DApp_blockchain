import { UserError } from './errors.js';

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function hashFile(file) {
  if (!file) throw new UserError('Choose a file first.');
  if (file.size > MAX_FILE_SIZE) throw new UserError('Files must be 25 MB or smaller.');
  if (!globalThis.crypto?.subtle) throw new UserError('Local hashing requires HTTPS or localhost. Open the secure version of this site.');
  let bytes;
  try { bytes = await file.arrayBuffer(); } catch { throw new UserError('The file could not be read. Select it again or choose a local copy.'); }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `0x${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
