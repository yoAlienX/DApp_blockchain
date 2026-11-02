// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocChainRegistry {
    address public immutable owner;
    mapping(address => bool) public issuers;

    struct Record { bool exists; address issuer; uint64 issuedAt; uint64 revokedAt; }
    mapping(bytes32 => Record) private records;

    error NotOwner(); error NotIssuer(); error ZeroHash(); error AlreadyIssued();
    error NotIssuedByCaller(); error NotFound(); error AlreadyRevoked(); error ZeroAddress();

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event DocumentIssued(bytes32 indexed docHash, address indexed issuer, uint64 issuedAt);
    event DocumentRevoked(bytes32 indexed docHash, address indexed issuer, uint64 revokedAt);

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyIssuer() { if (!issuers[msg.sender]) revert NotIssuer(); _; }

    constructor() { owner = msg.sender; }

    function addIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        issuers[issuer] = true; emit IssuerAdded(issuer);
    }
    function removeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        issuers[issuer] = false; emit IssuerRemoved(issuer);
    }
    function issue(bytes32 docHash) external onlyIssuer {
        if (docHash == bytes32(0)) revert ZeroHash();
        if (records[docHash].exists) revert AlreadyIssued();
        uint64 timestamp = uint64(block.timestamp);
        records[docHash] = Record(true, msg.sender, timestamp, 0);
        emit DocumentIssued(docHash, msg.sender, timestamp);
    }
    function revoke(bytes32 docHash) external {
        Record storage record = records[docHash];
        if (!record.exists) revert NotFound();
        if (record.issuer != msg.sender) revert NotIssuedByCaller();
        if (record.revokedAt != 0) revert AlreadyRevoked();
        uint64 timestamp = uint64(block.timestamp);
        record.revokedAt = timestamp; emit DocumentRevoked(docHash, msg.sender, timestamp);
    }
    function verify(bytes32 docHash) external view returns (bool exists, bool revoked, address issuer, uint64 issuedAt) {
        Record memory record = records[docHash];
        return (record.exists, record.revokedAt != 0, record.issuer, record.issuedAt);
    }
    function isIssuer(address account) external view returns (bool) { return issuers[account]; }
}
