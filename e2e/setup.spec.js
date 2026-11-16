const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test('unconfigured app explains setup, stays usable, and captures honest UI screenshots', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('/verify');
  await expect(page.getByRole('heading', { name: 'Registry setup required' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Choose file' })).toBeDisabled();
  fs.mkdirSync('docs/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/screenshots/verify-setup-desktop.png', fullPage: true });
  await page.goto('/login');
  await page.getByRole('button', { name: /Authority Admin/i }).click();
  await page.getByRole('button', { name: 'Sign in & resume session' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('button', { name: 'Register on Sepolia' })).toBeDisabled();
  await page.screenshot({ path: 'docs/screenshots/issue-setup-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/verify');
  await page.screenshot({ path: 'docs/screenshots/verify-setup-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
