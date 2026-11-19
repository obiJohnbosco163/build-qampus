// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QampusRegistry {
    struct AnchorRecord {
        uint8 milestoneType;
        uint64 anchoredAt;
        uint64 blockNumber;
    }

    mapping(address student => mapping(bytes32 contentHash => AnchorRecord record)) private anchors;
    mapping(bytes32 endorsementKey => bool exists) private endorsements;

    event AnchorCreated(
        address indexed student,
        bytes32 indexed contentHash,
        uint8 milestoneType,
        uint64 anchoredAt
    );

    event MilestoneEndorsed(
        address indexed student,
        bytes32 indexed contentHash,
        address indexed endorser,
        bytes32 attestationHash,
        uint64 endorsedAt
    );

    error InvalidContentHash();
    error InvalidMilestoneType();
    error AlreadyAnchored();
    error AnchorNotFound();
    error SelfEndorsement();
    error EmptyAttestation();
    error DuplicateEndorsement();
    error TimestampOutOfRange();

    function anchor(bytes32 contentHash, uint8 milestoneType) external {
        if (contentHash == bytes32(0)) revert InvalidContentHash();
        if (milestoneType > 5) revert InvalidMilestoneType();
        if (anchors[msg.sender][contentHash].anchoredAt != 0) revert AlreadyAnchored();
        if (block.timestamp > type(uint64).max || block.number > type(uint64).max) revert TimestampOutOfRange();

        uint64 timestamp = uint64(block.timestamp);
        anchors[msg.sender][contentHash] = AnchorRecord({
            milestoneType: milestoneType,
            anchoredAt: timestamp,
            blockNumber: uint64(block.number)
        });
        emit AnchorCreated(msg.sender, contentHash, milestoneType, timestamp);
    }

    function getAnchor(address student, bytes32 contentHash)
        external
        view
        returns (bool exists, uint8 milestoneType, uint64 anchoredAt, uint64 blockNumber)
    {
        AnchorRecord memory record = anchors[student][contentHash];
        return (record.anchoredAt != 0, record.milestoneType, record.anchoredAt, record.blockNumber);
    }

    function endorse(address student, bytes32 contentHash, bytes32 attestationHash) external {
        if (anchors[student][contentHash].anchoredAt == 0) revert AnchorNotFound();
        if (msg.sender == student) revert SelfEndorsement();
        if (attestationHash == bytes32(0)) revert EmptyAttestation();
        if (block.timestamp > type(uint64).max) revert TimestampOutOfRange();

        bytes32 endorsementKey = keccak256(abi.encode(student, contentHash, msg.sender));
        if (endorsements[endorsementKey]) revert DuplicateEndorsement();
        endorsements[endorsementKey] = true;
        emit MilestoneEndorsed(student, contentHash, msg.sender, attestationHash, uint64(block.timestamp));
    }

    function hasEndorsed(address student, bytes32 contentHash, address endorser)
        external
        view
        returns (bool)
    {
        return endorsements[keccak256(abi.encode(student, contentHash, endorser))];
    }
}
