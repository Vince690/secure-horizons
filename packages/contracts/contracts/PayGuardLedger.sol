// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title PayGuardLedger
/// @notice The on-chain half of PayGuard. The guardian wallet (owner) pays merchants
///         through `pay`, which moves the funds AND anchors the hash of the decision;
///         refused or held decisions are anchored with `record`; the kill switch pauses
///         every payment while still allowing refusals to be recorded as proof.
///         Avalanche Fuji testnet only. Test tokens, no real value.
contract PayGuardLedger is Ownable, Pausable {
    /// 0 = APPROVED (set by pay), 1 = HOLD, 2 = BLOCKED, 3 = REJECTED
    struct Record {
        uint8 verdict;
        bytes32 decisionHash;
        uint64 timestamp;
        address to;
        uint256 amount;
    }

    mapping(bytes32 => Record) private _decisions;
    uint256 public decisionCount;

    event PaymentExecuted(bytes32 indexed decisionId, address indexed to, uint256 amount, bytes32 decisionHash);
    event DecisionRecorded(bytes32 indexed decisionId, uint8 verdict, bytes32 decisionHash);
    event KillSwitchActivated(string reason);
    event KillSwitchDeactivated();

    error DecisionAlreadyRecorded(bytes32 decisionId);
    error InvalidVerdict(uint8 verdict);
    error NoValue();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    /// @notice Pay a merchant and anchor the approved decision in the same transaction.
    function pay(bytes32 decisionId, address payable to, bytes32 decisionHash) external payable onlyOwner whenNotPaused {
        if (_decisions[decisionId].timestamp != 0) revert DecisionAlreadyRecorded(decisionId);
        if (msg.value == 0) revert NoValue();
        _decisions[decisionId] = Record(0, decisionHash, uint64(block.timestamp), to, msg.value);
        decisionCount += 1;
        (bool ok, ) = to.call{value: msg.value}("");
        if (!ok) revert TransferFailed();
        emit PaymentExecuted(decisionId, to, msg.value, decisionHash);
    }

    /// @notice Anchor a non-payment decision. Works while paused: a refusal is also a proof.
    function record(bytes32 decisionId, uint8 verdict, bytes32 decisionHash) external onlyOwner {
        if (verdict == 0 || verdict > 3) revert InvalidVerdict(verdict);
        if (_decisions[decisionId].timestamp != 0) revert DecisionAlreadyRecorded(decisionId);
        _decisions[decisionId] = Record(verdict, decisionHash, uint64(block.timestamp), address(0), 0);
        decisionCount += 1;
        emit DecisionRecorded(decisionId, verdict, decisionHash);
    }

    /// @notice Stop every payment. Only the owner can re-arm.
    function activateKillSwitch(string calldata reason) external onlyOwner {
        _pause();
        emit KillSwitchActivated(reason);
    }

    function deactivateKillSwitch() external onlyOwner {
        _unpause();
        emit KillSwitchDeactivated();
    }

    function isKillSwitchActive() external view returns (bool) {
        return paused();
    }

    function getDecision(bytes32 decisionId)
        external
        view
        returns (uint8 verdict, bytes32 decisionHash, uint256 timestamp, address to, uint256 amount)
    {
        Record memory r = _decisions[decisionId];
        return (r.verdict, r.decisionHash, r.timestamp, r.to, r.amount);
    }
}
