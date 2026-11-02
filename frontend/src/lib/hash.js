export async function hashFile(file) {
  if (!file) throw new Error('Choose a file first.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Files must be 25 MB or smaller.');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return `0x${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
