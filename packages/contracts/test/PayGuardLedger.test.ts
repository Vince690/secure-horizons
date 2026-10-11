import { expect } from "chai";
import hre from "hardhat";
import { getAddress, keccak256, parseEther, toBytes, toHex } from "viem";

const id = (s: string) => keccak256(toBytes(s));
const HASH = toHex(new Uint8Array(32).fill(0xab));

async function deploy() {
  const [owner, merchant, stranger] = await hre.viem.getWalletClients();
  const ledger = await hre.viem.deployContract("PayGuardLedger");
  const publicClient = await hre.viem.getPublicClient();
  return { owner, merchant, stranger, ledger, publicClient };
}

describe("PayGuardLedger", () => {
  it("pays the merchant and anchors the decision", async () => {
    const { ledger, merchant, publicClient } = await deploy();
    const before = await publicClient.getBalance({ address: merchant.account.address });
    await ledger.write.pay([id("dec_1"), merchant.account.address, HASH], { value: parseEther("0.01") });
    const after = await publicClient.getBalance({ address: merchant.account.address });
    expect(after - before).to.equal(parseEther("0.01"));
    const [verdict, hash, ts, to, amount] = await ledger.read.getDecision([id("dec_1")]);
    expect(verdict).to.equal(0);
    expect(hash).to.equal(HASH);
    expect(Number(ts)).to.be.greaterThan(0);
    expect(getAddress(to)).to.equal(getAddress(merchant.account.address));
    expect(amount).to.equal(parseEther("0.01"));
    expect(await ledger.read.decisionCount()).to.equal(1n);
    const events = await ledger.getEvents.PaymentExecuted();
    expect(events).to.have.length(1);
  });

  it("refuses duplicate decision ids", async () => {
    const { ledger, merchant } = await deploy();
    await ledger.write.pay([id("dec_1"), merchant.account.address, HASH], { value: parseEther("0.01") });
    await expect(ledger.write.record([id("dec_1"), 2, HASH])).to.be.rejectedWith("DecisionAlreadyRecorded");
  });

  it("records HOLD / BLOCKED / REJECTED / OFF-CHAIN-APPROVED and rejects invalid verdicts", async () => {
    const { ledger } = await deploy();
    await ledger.write.record([id("h"), 1, HASH]);
    await ledger.write.record([id("b"), 2, HASH]);
    await ledger.write.record([id("r"), 3, HASH]);
    await ledger.write.record([id("card"), 4, HASH]); // paid on another rail, anchored here
    expect(await ledger.read.decisionCount()).to.equal(4n);
    await expect(ledger.write.record([id("x"), 0, HASH])).to.be.rejectedWith("InvalidVerdict");
    await expect(ledger.write.record([id("y"), 5, HASH])).to.be.rejectedWith("InvalidVerdict");
  });

  it("kill switch blocks pay() but still allows record(), then re-arms", async () => {
    const { ledger, merchant } = await deploy();
    await ledger.write.activateKillSwitch(["3 blocked decisions in 10 minutes"]);
    expect(await ledger.read.isKillSwitchActive()).to.equal(true);
    await expect(ledger.write.pay([id("p"), merchant.account.address, HASH], { value: parseEther("0.01") })).to.be.rejectedWith(
      "EnforcedPause",
    );
    await ledger.write.record([id("blocked-while-paused"), 2, HASH]);
    await ledger.write.deactivateKillSwitch();
    expect(await ledger.read.isKillSwitchActive()).to.equal(false);
    await ledger.write.pay([id("p2"), merchant.account.address, HASH], { value: parseEther("0.01") });
  });

  it("only the owner can pay, record or toggle the kill switch", async () => {
    const { ledger, merchant, stranger } = await deploy();
    const asStranger = await hre.viem.getContractAt("PayGuardLedger", ledger.address, { client: { wallet: stranger } });
    await expect(asStranger.write.pay([id("s"), merchant.account.address, HASH], { value: parseEther("0.01") })).to.be.rejectedWith(
      "OwnableUnauthorizedAccount",
    );
    await expect(asStranger.write.record([id("s"), 2, HASH])).to.be.rejectedWith("OwnableUnauthorizedAccount");
    await expect(asStranger.write.activateKillSwitch(["nope"])).to.be.rejectedWith("OwnableUnauthorizedAccount");
  });
});
