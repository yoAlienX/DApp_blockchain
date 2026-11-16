const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
const { settings, assertSepolia, reportError, SetupError } = require('./environment');

async function main() {
  const registryRequired = process.argv.includes('--registry');
  const values = settings({ registry: registryRequired });
  const request = new ethers.FetchRequest(values.rpcUrl);
  request.timeout = 15000;
  const provider = new ethers.JsonRpcProvider(request, undefined, { batchMaxCount: 1 });
  try {
    await assertSepolia(provider);
    const wallet = new ethers.Wallet(values.privateKey);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Network: Sepolia (11155111)\nDeployer: ${wallet.address}\nTest ETH balance: ${ethers.formatEther(balance)}`);
    if (balance === 0n) throw new SetupError('Fund this test wallet with Sepolia test ETH before deploying or administering issuers.');
    if (registryRequired) {
      if (await provider.getCode(values.contractAddress) === '0x') throw new SetupError('No contract exists at CONTRACT_ADDRESS on Sepolia.');
      const registry = new ethers.Contract(values.contractAddress, ['function owner() view returns (address)', 'function isIssuer(address) view returns (bool)'], provider);
      if ((await registry.owner()).toLowerCase() !== wallet.address.toLowerCase()) throw new SetupError('DEPLOYER_PRIVATE_KEY does not belong to this registry owner.');
      const authorized = await registry.isIssuer(values.issuerAddress);
      console.log(`Registry: ${values.contractAddress}\nIssuer: ${values.issuerAddress}\nAuthorized: ${authorized}`);
      if (process.argv.includes('--frontend')) {
        if (!authorized) throw new SetupError('The demo issuer is not authorized. Run npm run add-issuer first.');
        const frontendPath = path.join(__dirname, '../frontend/.env');
        if (!fs.existsSync(frontendPath)) throw new SetupError('Create frontend/.env from its example.');
        const frontend = dotenv.parse(fs.readFileSync(frontendPath));
        const { parseSettings } = await import('../frontend/src/lib/settings.js');
        const parsed = parseSettings(frontend);
        if (parsed.errors.length) throw new SetupError(parsed.errors.join(' '));
        if (parsed.config.contractAddress.toLowerCase() !== values.contractAddress.toLowerCase()) throw new SetupError('Root and frontend contract addresses do not match.');
        const browserRequest = new ethers.FetchRequest(parsed.config.rpcUrl);
        browserRequest.timeout = 15000;
        const browserProvider = new ethers.JsonRpcProvider(browserRequest, undefined, { batchMaxCount: 1 });
        try {
          await assertSepolia(browserProvider);
          if (await browserProvider.getCode(values.contractAddress) === '0x') throw new SetupError('The frontend RPC cannot read the deployed registry.');
        } finally { browserProvider.destroy(); }
        console.log('Frontend environment matches the deployment. Still test browser CORS and hosted settings manually.');
      }
    }
    console.log('Preflight passed. No transaction was sent.');
  } finally { provider.destroy(); }
}

main().catch(reportError);
