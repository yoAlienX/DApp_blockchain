const path = require('node:path');
process.env.HARDHAT_CONFIG = path.join(__dirname, 'hardhat.config.cjs');
const hre = require('hardhat');
const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  chain: async ({ page }, use) => {
    await hre.network.provider.send('hardhat_reset');
    const [owner, issuer, other] = await hre.ethers.getSigners();
    const registry = await (await hre.ethers.getContractFactory('DocChainRegistry')).deploy();
    await registry.waitForDeployment();
    expect(await registry.getAddress()).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3');
    await (await registry.addIssuer(issuer.address)).wait();
    const requests = [];
    const failures = { reads: false };
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.route('https://rpc.docchain.invalid/**', async route => {
      const body = route.request().postDataJSON();
      requests.push(body);
      let response;
      try {
        if (failures.reads) throw new Error('RPC temporarily unavailable');
        response = { jsonrpc: '2.0', id: body.id, result: await hre.network.provider.send(body.method, body.params || []) };
      } catch {
        response = { jsonrpc: '2.0', id: body.id, error: { code: -32000, message: 'RPC request failed' } };
      }
      await route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(response) });
    });
    await page.exposeFunction('testWalletRpc', async ({ method, params }) => hre.network.provider.send(method, params || []));
    const installWallet = async ({ account = issuer.address, connected = false, chainId = '0xaa36a7' } = {}) => {
      await page.addInitScript(({ account, connected, chainId }) => {
        const listeners = {};
        const state = { account, connected, chainId, rejectNext: false, unknownChain: false, requests: [], listeners };
        state.emit = (event, value) => (listeners[event] || []).forEach(listener => listener(value));
        state.changeAccount = next => { state.account = next; state.connected = true; state.emit('accountsChanged', [next]); };
        state.changeChain = next => { state.chainId = next; state.emit('chainChanged', next); };
        window.testWallet = state;
        window.ethereum = {
          on(event, listener) { (listeners[event] ||= []).push(listener); },
          removeListener(event, listener) { listeners[event] = (listeners[event] || []).filter(value => value !== listener); },
          async request({ method, params }) {
            state.requests.push(method);
            if (method === 'eth_accounts') return state.connected ? [state.account] : [];
            if (method === 'eth_requestAccounts') { state.connected = true; return [state.account]; }
            if (method === 'eth_chainId') return state.chainId;
            if (method === 'wallet_switchEthereumChain') {
              if (state.unknownChain) throw Object.assign(new Error('Unknown chain'), { code: 4902 });
              state.changeChain(params[0].chainId); return null;
            }
            if (method === 'wallet_addEthereumChain') { state.unknownChain = false; return null; }
            if (method === 'eth_sendTransaction' && state.rejectNext) { state.rejectNext = false; throw Object.assign(new Error('User rejected'), { code: 4001 }); }
            return window.testWalletRpc({ method, params });
          }
        };
      }, { account, connected, chainId });
    };
    await use({ registry, owner, issuer, other, requests, failures, installWallet });
  }
});

module.exports = { test, expect, hre };
