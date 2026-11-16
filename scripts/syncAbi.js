const fs = require('node:fs');
const path = require('node:path');

const artifactPath = path.join(__dirname, '../artifacts/contracts/DocChainRegistry.sol/DocChainRegistry.json');
if (!fs.existsSync(artifactPath)) {
  console.error('Compile the contract first with npm run compile.');
  process.exitCode = 1;
} else {
  const { abi } = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const destination = path.join(__dirname, '../frontend/src/abi/DocChainRegistry.json');
  const output = `${JSON.stringify(abi, null, 2)}\n`;
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) fs.writeFileSync(destination, output);
  console.log('Frontend ABI synchronized from the compiled DocChainRegistry artifact.');
}
