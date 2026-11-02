const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("DocChainRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log(`DocChainRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
