const { test, expect, hre } = require('./fixtures');

const original = { name: 'certificate.txt', mimeType: 'text/plain', buffer: Buffer.from('SealMark browser regression document\n') };
const fingerprint = hre.ethers.sha256(original.buffer);

async function signInAsAdmin(page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Authority Admin/i }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Sign in & resume session' }).click();
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();
}

test('boot progress completes before showing landing page, radial theme switcher and FAQ work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Verify official documents/i })).toBeVisible({ timeout: 10000 });
  const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  expect(isDarkBefore).toBe(false);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
  await expect(page.getByText('0xf72095cad18c96031c79d73900811886b4857547f4c08a1cb85695215e70ea04')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reveal fingerprint' }).click();
  await expect(page.getByText('0xf72095cad18c96031c79d73900811886b4857547f4c08a1cb85695215e70ea04')).toBeVisible();
  await page.getByRole('button', { name: 'Hide fingerprint' }).click();
  await page.getByRole('button', { name: 'Flip to usage chart' }).click();
  await expect(page.getByText('System Usage Trend')).toBeVisible();
  await page.getByRole('button', { name: 'Flip to record preview' }).click();
  await page.getByRole('heading', { name: 'Built for verifiable official records' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Built for verifiable official records' })).toBeVisible();
  await page.locator('#main-content').getByRole('link', { name: /How to Use & FAQ/i }).click();
  await expect(page.getByRole('heading', { name: 'How to use SealMark' })).toBeVisible();
});

test('user role restrictions, profile customization, password reset, and logout/resume work', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Standard User/i }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Sign in & resume session' }).click();
  await expect(page.getByRole('heading', { name: 'Verify a document on Sepolia' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Restricted to Issuing Authorities' })).toBeVisible();

  await page.goto('/profile');
  await page.getByLabel('Display name').fill('Aarav Updated');
  await page.getByRole('button', { name: 'Save profile changes' }).click();
  await expect(page.getByText('Profile and avatar updated.')).toBeVisible();

  await page.getByLabel('Current password').fill('User@123');
  await page.getByLabel('New password (min 8 characters)').fill('NewPass@99');
  await page.getByLabel('Confirm new password').fill('NewPass@99');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Password updated successfully.')).toBeVisible();

  await page.goto('/activity');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/login');
  await page.getByLabel('Email address').fill('user@sealmark.org');
  await page.getByLabel('Password').fill('NewPass@99');
  await page.getByRole('button', { name: 'Sign in & resume session' }).click();
  await expect(page).toHaveURL(/\/activity$/);
  await expect(page.getByText(/Welcome back, Aarav Updated/)).toBeVisible();
});

test('wallet-free verification reads a real local-EVM record and detects tampering', async ({ page, chain }) => {
  await (await chain.registry.connect(chain.issuer).issue(fingerprint)).wait();
  await page.goto('/verify');
  await expect(page.getByRole('heading', { name: 'Registry setup required' })).toHaveCount(0, { timeout: 10000 });
  expect(await page.evaluate(() => Boolean(window.ethereum))).toBe(false);
  await page.getByLabel('Document file').setInputFiles(original);
  await expect(page.getByTestId('verification-result').getByText('Verified', { exact: true })).toBeVisible();
  await expect(page.getByTestId('verification-result')).toContainText(chain.issuer.address);
  await page.getByLabel('Document file').setInputFiles({ ...original, buffer: Buffer.from('SealMark browser regression document!\n') });
  await expect(page.getByTestId('verification-result')).toContainText('Not registered');
  await expect(page.getByTestId('verification-result')).toContainText('does not by itself prove');
  expect(chain.requests.every(request => !JSON.stringify(request).includes(original.buffer.toString()))).toBe(true);
});

test('connect, issue, verify, revoke, and activity work end-to-end on the local EVM', async ({ page, chain }) => {
  await chain.installWallet();
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
  expect(await page.evaluate(() => window.testWallet.requests.includes('eth_requestAccounts'))).toBe(false);
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(page.getByText('Authorized issuer', { exact: true })).toBeVisible();
  await page.getByLabel('Document file').setInputFiles(original);
  await page.getByRole('button', { name: 'Register on Sepolia' }).click();
  await expect(page.getByText('Transaction confirmed on Sepolia.')).toBeVisible();
  expect((await chain.registry.verify(fingerprint)).exists).toBe(true);
  await page.getByRole('link', { name: 'Verify', exact: true }).click();
  await page.getByRole('region', { name: 'Verify a document' }).getByLabel('Document file').setInputFiles(original);
  await expect(page.getByTestId('verification-result')).toContainText('Verified');
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await page.getByLabel('Document fingerprint', { exact: true }).fill(fingerprint);
  await page.getByRole('button', { name: 'Check record', exact: true }).click();
  await expect(page.getByText('This document was issued by the connected wallet.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revoke permanently' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Revoke permanently' }).click();
  await expect(page.getByText('Transaction confirmed on Sepolia.')).toBeVisible();
  expect((await chain.registry.verify(fingerprint)).revoked).toBe(true);
  await expect(page.getByRole('button', { name: 'Revoke permanently' })).toBeDisabled();
  await page.getByRole('link', { name: 'Verify', exact: true }).click();
  await page.getByRole('region', { name: 'Verify a document' }).getByLabel('Document file').setInputFiles(original);
  await expect(page.getByTestId('verification-result')).toContainText('Revoked');
  await expect(page.getByTestId('verification-result')).toContainText(chain.issuer.address);
  await page.getByRole('link', { name: 'Activity', exact: true }).click();
  await expect(page.getByText('2 events found')).toBeVisible();
  await expect(page.locator('ol > li').first()).toContainText('Revoked');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('pending transactions retain the explorer link and lock both write actions', async ({ page, chain }) => {
  await chain.installWallet({ connected: true });
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByText('Authorized issuer', { exact: true })).toBeVisible();
  await page.getByLabel('Document file').setInputFiles(original);
  await hre.network.provider.send('evm_setAutomine', [false]);
  try {
    await page.getByRole('button', { name: 'Register on Sepolia' }).click();
    await expect(page.getByText('Submitted. Waiting for a Sepolia confirmation…')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View transaction' })).toHaveAttribute('href', /\/tx\/0x[\da-f]{64}$/i);
    await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Choose file' })).toBeDisabled();
    await expect(page.getByLabel('Document fingerprint', { exact: true })).toBeDisabled();
    await hre.network.provider.send('evm_mine');
    await expect(page.getByText('Transaction confirmed on Sepolia.')).toBeVisible();
  } finally { await hre.network.provider.send('evm_setAutomine', [true]); }
});

test('a removed issuer can revoke its records without being allowed to issue', async ({ page, chain }) => {
  await (await chain.registry.connect(chain.issuer).issue(fingerprint)).wait();
  await (await chain.registry.removeIssuer(chain.issuer.address)).wait();
  await chain.installWallet({ connected: true });
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByText('This wallet is not authorized to issue.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
  await page.getByLabel('Document fingerprint', { exact: true }).fill(fingerprint);
  await page.getByRole('button', { name: 'Check record', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Revoke permanently' }).click();
  await expect(page.getByText('Transaction confirmed on Sepolia.')).toBeVisible();
});

test('network switching and account changes refresh shared issuer access', async ({ page, chain }) => {
  await chain.installWallet({ connected: true, chainId: '0x1' });
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
  await page.evaluate(() => { window.testWallet.unknownChain = true; });
  await page.getByRole('button', { name: 'Switch to Sepolia' }).click();
  await expect(page.getByText('Authorized issuer', { exact: true })).toBeVisible();
  await page.evaluate(account => window.testWallet.changeAccount(account), chain.other.address);
  await expect(page.getByText('This wallet is not authorized to issue.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connect wallet' })).toBeVisible();
  await page.getByRole('link', { name: 'Verify', exact: true }).click();
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connect wallet' })).toBeVisible();
});

test('rejected transactions and duplicate issuance show actionable feedback', async ({ page, chain }) => {
  await chain.installWallet({ connected: true });
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByText('Authorized issuer', { exact: true })).toBeVisible();
  await page.getByLabel('Document file').setInputFiles(original);
  await page.evaluate(() => { window.testWallet.rejectNext = true; });
  await page.getByRole('button', { name: 'Register on Sepolia' }).click();
  await expect(page.getByText('Transaction cancelled in wallet.')).toBeVisible();
  await (await chain.registry.connect(chain.issuer).issue(fingerprint)).wait();
  await page.getByRole('button', { name: 'Register on Sepolia' }).click();
  await expect(page.getByText('Already registered', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.testWallet.requests.filter(method => method === 'eth_sendTransaction').length)).toBe(1);
});

test('public RPC errors preserve the local fingerprint and allow retry', async ({ page, chain }) => {
  chain.failures.reads = true;
  await page.goto('/verify');
  await page.getByLabel('Document file').setInputFiles(original);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText(fingerprint, { exact: true })).toBeVisible();
  chain.failures.reads = false;
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('verification-result')).toContainText('Not registered');
});

test('disabled dropzones ignore files and invalid revocation hashes stay blocked', async ({ page, chain }) => {
  await chain.installWallet({ account: chain.other.address, connected: true });
  await signInAsAdmin(page);
  await page.goto('/admin');
  await expect(page.getByText('This wallet is not authorized to issue.', { exact: false })).toBeVisible();
  await page.locator('[aria-disabled="true"]').evaluate(element => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['ignored'], 'ignored.txt'));
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
  });
  await expect(page.getByText('ignored.txt', { exact: true })).toHaveCount(0);
  await page.getByLabel('Document fingerprint', { exact: true }).fill('0x123');
  await page.getByRole('button', { name: 'Check record', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('64 hexadecimal');
  await expect(page.getByRole('button', { name: 'Revoke permanently' })).toBeDisabled();
});

test('empty activity and mobile layouts have no horizontal overflow', async ({ page, chain }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/activity');
  await expect(page.getByText('No events found in the latest 5,000 blocks.', { exact: false })).toBeVisible({ timeout: 10000 });
  for (const path of ['/', '/verify', '/faq', '/login', '/activity']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
