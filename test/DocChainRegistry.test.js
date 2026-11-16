const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocChainRegistry", function () {
  async function setup() {
    const [owner, issuer, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("DocChainRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, owner, issuer, other, hash: ethers.sha256(ethers.toUtf8Bytes("document")) };
  }

  it("allows owner to add/remove issuers and rejects non-owner", async function () {
    const { registry, owner, issuer, other } = await setup();
    await expect(registry.addIssuer(issuer.address)).to.emit(registry, "IssuerAdded").withArgs(issuer.address);
    expect(await registry.isIssuer(issuer.address)).to.equal(true);
    await expect(registry.connect(other).addIssuer(other.address)).to.be.revertedWithCustomError(registry, "NotOwner");
    await expect(registry.removeIssuer(issuer.address)).to.emit(registry, "IssuerRemoved").withArgs(issuer.address);
    expect(await registry.isIssuer(issuer.address)).to.equal(false);
  });
  it("issues and verifies a document", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await expect(registry.connect(issuer).issue(hash)).to.emit(registry, "DocumentIssued");
    const result = await registry.verify(hash);
    expect(result.exists).to.equal(true); expect(result.revoked).to.equal(false); expect(result.issuer).to.equal(issuer.address); expect(result.issuedAt).to.be.gt(0);
  });
  it("enforces issue and revoke rules", async function () {
    const { registry, issuer, other, hash } = await setup();
    await expect(registry.connect(issuer).issue(hash)).to.be.revertedWithCustomError(registry, "NotIssuer");
    await registry.addIssuer(issuer.address);
    await expect(registry.connect(issuer).issue(ethers.ZeroHash)).to.be.revertedWithCustomError(registry, "ZeroHash");
    await registry.connect(issuer).issue(hash);
    await expect(registry.connect(issuer).issue(hash)).to.be.revertedWithCustomError(registry, "AlreadyIssued");
    await expect(registry.connect(other).revoke(hash)).to.be.revertedWithCustomError(registry, "NotIssuedByCaller");
    await expect(registry.connect(issuer).revoke(hash)).to.emit(registry, "DocumentRevoked");
    expect((await registry.verify(hash)).revoked).to.equal(true);
    await expect(registry.connect(issuer).revoke(hash)).to.be.revertedWithCustomError(registry, "AlreadyRevoked");
  });
  it("returns empty data for unknown hashes and preserves records after removal", async function () {
    const { registry, issuer, hash } = await setup();
    const unknown = await registry.verify(hash);
    expect(unknown.exists).to.equal(false);
    await registry.addIssuer(issuer.address); await registry.connect(issuer).issue(hash); await registry.removeIssuer(issuer.address);
    expect((await registry.verify(hash)).issuer).to.equal(issuer.address);
  });

  it("sets the deployer as immutable owner without automatically authorizing it", async function () {
    const { registry, owner } = await setup();
    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.isIssuer(owner.address)).to.equal(false);
  });

  it("rejects unauthorized issuer removal", async function () {
    const { registry, issuer, other } = await setup();
    await registry.addIssuer(issuer.address);
    await expect(registry.connect(other).removeIssuer(issuer.address)).to.be.revertedWithCustomError(registry, "NotOwner");
    expect(await registry.isIssuer(issuer.address)).to.equal(true);
  });

  it("rejects zero addresses for both issuer administration operations", async function () {
    const { registry } = await setup();
    await expect(registry.addIssuer(ethers.ZeroAddress)).to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.removeIssuer(ethers.ZeroAddress)).to.be.revertedWithCustomError(registry, "ZeroAddress");
  });

  it("records the exact issuance event fields and block timestamp", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    const transaction = await registry.connect(issuer).issue(hash);
    const receipt = await transaction.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    await expect(transaction).to.emit(registry, "DocumentIssued").withArgs(hash, issuer.address, block.timestamp);
    expect(await registry.verify(hash)).to.deep.equal([true, false, issuer.address, BigInt(block.timestamp)]);
  });

  it("rejects a duplicate issued by a different authorized issuer", async function () {
    const { registry, issuer, other, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await registry.addIssuer(other.address);
    await registry.connect(issuer).issue(hash);
    await expect(registry.connect(other).issue(hash)).to.be.revertedWithCustomError(registry, "AlreadyIssued");
    await expect(registry.connect(other).revoke(hash)).to.be.revertedWithCustomError(registry, "NotIssuedByCaller");
  });

  it("rejects revoking unknown and zero hashes", async function () {
    const { registry, issuer, hash } = await setup();
    await expect(registry.connect(issuer).revoke(hash)).to.be.revertedWithCustomError(registry, "NotFound");
    await expect(registry.revoke(ethers.ZeroHash)).to.be.revertedWithCustomError(registry, "NotFound");
  });

  it("returns all empty fields for unknown and zero hashes", async function () {
    const { registry, hash, other } = await setup();
    expect(await registry.connect(other).verify(hash)).to.deep.equal([false, false, ethers.ZeroAddress, 0n]);
    expect(await registry.verify(ethers.ZeroHash)).to.deep.equal([false, false, ethers.ZeroAddress, 0n]);
  });

  it("prevents a removed issuer from issuing new documents", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await registry.removeIssuer(issuer.address);
    await expect(registry.connect(issuer).issue(hash)).to.be.revertedWithCustomError(registry, "NotIssuer");
  });

  it("allows a removed original issuer to revoke while preserving the issue timestamp", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await registry.connect(issuer).issue(hash);
    const original = await registry.verify(hash);
    await registry.removeIssuer(issuer.address);
    const transaction = await registry.connect(issuer).revoke(hash);
    const receipt = await transaction.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    await expect(transaction).to.emit(registry, "DocumentRevoked").withArgs(hash, issuer.address, block.timestamp);
    expect(await registry.verify(hash)).to.deep.equal([true, true, issuer.address, original.issuedAt]);
  });

  it("does not let the owner revoke another issuer's record", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await registry.connect(issuer).issue(hash);
    await expect(registry.revoke(hash)).to.be.revertedWithCustomError(registry, "NotIssuedByCaller");
  });

  it("never permits reissuing a revoked hash", async function () {
    const { registry, issuer, hash } = await setup();
    await registry.addIssuer(issuer.address);
    await registry.connect(issuer).issue(hash);
    await registry.connect(issuer).revoke(hash);
    await expect(registry.connect(issuer).issue(hash)).to.be.revertedWithCustomError(registry, "AlreadyIssued");
  });

  it("isolates documents and makes altered bytes unregistered", async function () {
    const { registry, issuer, hash } = await setup();
    const altered = ethers.sha256(ethers.toUtf8Bytes("Document"));
    await registry.addIssuer(issuer.address);
    await registry.connect(issuer).issue(hash);
    expect((await registry.verify(altered)).exists).to.equal(false);
    await registry.connect(issuer).issue(altered);
    await registry.connect(issuer).revoke(hash);
    expect((await registry.verify(altered)).revoked).to.equal(false);
  });

  it("ships the complete compiled ABI in the frontend", async function () {
    const artifact = await require("hardhat").artifacts.readArtifact("DocChainRegistry");
    expect(require("../frontend/src/abi/DocChainRegistry.json")).to.deep.equal(artifact.abi);
  });
});
