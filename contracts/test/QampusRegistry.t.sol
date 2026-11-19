// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../QampusRegistry.sol";

contract QampusReviewer {
    function endorse(QampusRegistry registry, address student, bytes32 contentHash, bytes32 attestationHash) external {
        registry.endorse(student, contentHash, attestationHash);
    }
}

contract QampusRegistryTest {
    function testAnchorRoundTrip() public {
        QampusRegistry registry = new QampusRegistry();
        bytes32 fingerprint = keccak256("milestone");
        registry.anchor(fingerprint, 1);

        (bool exists, uint8 milestoneType, uint64 anchoredAt, uint64 blockNumber) = registry.getAnchor(address(this), fingerprint);
        require(exists, "anchor should exist");
        require(milestoneType == 1, "milestone type should match");
        require(anchoredAt != 0, "timestamp should be set");
        require(blockNumber != 0, "block number should be set");
    }

    function testRejectsDuplicateAnchor() public {
        QampusRegistry registry = new QampusRegistry();
        bytes32 fingerprint = keccak256("milestone");
        registry.anchor(fingerprint, 1);
        bool rejected;
        try registry.anchor(fingerprint, 1) {
            rejected = false;
        } catch {
            rejected = true;
        }
        require(rejected, "duplicate anchors should be rejected");
    }

    function testRejectsInvalidTypeAndEmptyHash() public {
        QampusRegistry registry = new QampusRegistry();
        bool invalidTypeRejected;
        try registry.anchor(keccak256("milestone"), 6) {
            invalidTypeRejected = false;
        } catch {
            invalidTypeRejected = true;
        }
        require(invalidTypeRejected, "unknown milestone type should be rejected");

        bool emptyHashRejected;
        try registry.anchor(bytes32(0), 1) {
            emptyHashRejected = false;
        } catch {
            emptyHashRejected = true;
        }
        require(emptyHashRejected, "empty content hash should be rejected");
    }

    function testFuzzAnchorRoundTrip(bytes32 fingerprint, uint8 milestoneType) public {
        if (fingerprint == bytes32(0) || milestoneType > 5) return;
        QampusRegistry registry = new QampusRegistry();
        registry.anchor(fingerprint, milestoneType);
        (bool exists, uint8 storedType,,) = registry.getAnchor(address(this), fingerprint);
        require(exists && storedType == milestoneType, "stored anchor should match input");
    }

    function testOtherWalletCanEndorseOnce() public {
        QampusRegistry registry = new QampusRegistry();
        bytes32 fingerprint = keccak256("milestone");
        QampusReviewer reviewer = new QampusReviewer();
        registry.anchor(fingerprint, 1);
        reviewer.endorse(registry, address(this), fingerprint, keccak256("review"));
        require(registry.hasEndorsed(address(this), fingerprint, address(reviewer)), "endorsement should be recorded");

        bool duplicateRejected;
        try reviewer.endorse(registry, address(this), fingerprint, keccak256("review-again")) {
            duplicateRejected = false;
        } catch {
            duplicateRejected = true;
        }
        require(duplicateRejected, "duplicate reviewer endorsement should be rejected");
    }

    function testStudentCannotEndorseOwnAnchor() public {
        QampusRegistry registry = new QampusRegistry();
        bytes32 fingerprint = keccak256("milestone");
        registry.anchor(fingerprint, 1);
        bool selfEndorsementRejected;
        try registry.endorse(address(this), fingerprint, keccak256("self-review")) {
            selfEndorsementRejected = false;
        } catch {
            selfEndorsementRejected = true;
        }
        require(selfEndorsementRejected, "self-endorsement should be rejected");
    }
}
