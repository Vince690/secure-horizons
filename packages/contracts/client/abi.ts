import { parseAbi } from "viem";

/** Hand-written from contracts/PayGuardLedger.sol so the client needs no compile step. */
export const payGuardLedgerAbi = parseAbi([
  "function pay(bytes32 decisionId, address to, bytes32 decisionHash) payable",
  "function record(bytes32 decisionId, uint8 verdict, bytes32 decisionHash)",
  "function activateKillSwitch(string reason)",
  "function deactivateKillSwitch()",
  "function isKillSwitchActive() view returns (bool)",
  "function paused() view returns (bool)",
  "function decisionCount() view returns (uint256)",
  "function getDecision(bytes32 decisionId) view returns (uint8 verdict, bytes32 decisionHash, uint256 timestamp, address to, uint256 amount)",
  "function owner() view returns (address)",
  "event PaymentExecuted(bytes32 indexed decisionId, address indexed to, uint256 amount, bytes32 decisionHash)",
  "event DecisionRecorded(bytes32 indexed decisionId, uint8 verdict, bytes32 decisionHash)",
  "event KillSwitchActivated(string reason)",
  "event KillSwitchDeactivated()",
]);
