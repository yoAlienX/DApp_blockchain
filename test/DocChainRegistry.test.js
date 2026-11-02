const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocChainRegistry", function () {
  async function setup() {
    const [owner, issuer, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("DocChainRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, owner, issuer, other, hash: ethers.keccak256(ethers.toUtf8Bytes("document")) };
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
});
