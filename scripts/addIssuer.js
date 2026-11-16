const hre = require("hardhat");
const { settings, assertSepolia, reportError, SetupError } = require('./environment');

async function main() {
  const { issuerAddress: address, contractAddress } = settings({ registry: true });
  await assertSepolia(hre.ethers.provider);
  if (await hre.ethers.provider.getCode(contractAddress) === '0x') throw new SetupError('No registry contract exists at this Sepolia address.');
  const registry = await hre.ethers.getContractAt("DocChainRegistry", contractAddress);
  const [signer] = await hre.ethers.getSigners();
  if ((await registry.owner()).toLowerCase() !== signer.address.toLowerCase()) throw new SetupError('Only this registry owner can authorize an issuer.');
  if (await registry.isIssuer(address)) { console.log(`Issuer already authorized: ${address}. No transaction sent.`); return; }
  const tx = await registry.addIssuer(address);
  console.log(`Submitted issuer authorization: ${tx.hash}`);
  await tx.wait(1);
  console.log(`Issuer added: ${address}\nTransaction: ${tx.hash}`);
}

main().catch(reportError);
