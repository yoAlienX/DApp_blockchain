const { defineConfig } = require('@playwright/test');
const { existsSync } = require('node:fs');

const publicTestSettings = {
  VITE_CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  VITE_RPC_URL: 'https://rpc.docchain.invalid',
  VITE_CHAIN_ID: '11155111', VITE_EXPLORER_URL: 'https://sepolia.etherscan.io'
};

module.exports = defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 10000 }, reporter: 'list',
  use: {
    channel: existsSync('/usr/bin/google-chrome') ? 'chrome' : undefined,
    trace: 'retain-on-failure', screenshot: 'only-on-failure', viewport: { width: 1440, height: 1000 }
  },
  projects: [
    { name: 'local-evm', testMatch: 'app.spec.js', use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'setup', testMatch: 'setup.spec.js', use: { baseURL: 'http://127.0.0.1:4174' } }
  ],
  webServer: [
    { command: 'npm --prefix frontend run dev -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', env: publicTestSettings, reuseExistingServer: false },
    { command: 'npm --prefix frontend run build && npm --prefix frontend run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', env: Object.fromEntries(Object.keys(publicTestSettings).map(key => [key, ''])), reuseExistingServer: false }
  ]
});
