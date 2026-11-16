const hre = require("hardhat");
const fs = require('node:fs');
const path = require('node:path');
const { settings, assertSepolia, reportError } = require('./environment');

async function main() {
  settings();
  await assertSepolia(hre.ethers.provider);
  const Registry = await hre.ethers.getContractFactory("DocChainRegistry");
  const registry = await Registry.deploy();
  console.log(`Deployment submitted: ${registry.deploymentTransaction().hash}`);
  await registry.waitForDeployment();
  const receipt = await registry.deploymentTransaction().wait(1);
  const address = await registry.getAddress();
  const metadata = {
    network: 'sepolia', chainId: 11155111, contractAddress: address,
    owner: await registry.owner(), deploymentTransaction: receipt.hash,
    deploymentBlock: receipt.blockNumber, recordedAt: new Date().toISOString()
  };
  const directory = path.join(__dirname, '../deployments');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `sepolia-${address}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`DocChainRegistry deployed to: ${address}\nTransaction: ${receipt.hash}\nExplorer: https://sepolia.etherscan.io/address/${address}`);
  console.log('Set this address in root CONTRACT_ADDRESS and frontend VITE_CONTRACT_ADDRESS, then authorize your demo issuer.');
}

main().catch(reportError);
