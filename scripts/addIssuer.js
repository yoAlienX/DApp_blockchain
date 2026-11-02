const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const address = process.env.ISSUER_ADDRESS;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!address || !contractAddress) throw new Error("Set ISSUER_ADDRESS and CONTRACT_ADDRESS in .env");
  const registry = await hre.ethers.getContractAt("DocChainRegistry", contractAddress);
  const tx = await registry.addIssuer(address);
  await tx.wait();
  console.log(`Issuer added: ${address}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
