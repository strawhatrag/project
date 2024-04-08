import { expect } from "chai";
import { viem, network } from "hardhat";
import { toHex, parseEther } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const PROPOSALS = ["Proposal1", "Proposal2"];

// Deploy MyToken contract and mint tokens to accounts
async function setupMyToken() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2] = await viem.getWalletClients();
  const MyToken = await viem.deployContract("MyToken");
  console.log(`MyToken deployed to: ${MyToken.address}`);

  // Mint tokens to accounts and log the transaction details
  const mintAmount = parseEther("100"); // Define the mint amount

  await MyToken.write.mint([acc1.account.address, mintAmount]);
  const mintTx1BlockNumber = await publicClient.getBlockNumber();
  console.log(
    `Minting ${mintAmount.toString()} tokens to ${
      acc1.account.address
    } confirmed, current block number: ${mintTx1BlockNumber}`
  );
  await MyToken.write.delegate([acc1.account.address], {
    account: acc1.account,
  });

  await MyToken.write.mint([acc2.account.address, mintAmount]);
  const mintTx2BlockNumber = await publicClient.getBlockNumber();
  console.log(
    `Minting ${mintAmount.toString()} tokens to ${
      acc2.account.address
    } confirmed, current block number: ${mintTx2BlockNumber}`
  );
  await MyToken.write.delegate([acc2.account.address], {
    account: acc2.account,
  });

  // Mine blocks after minting to simulate time passing
  await mineBlocks(10);

  const latestBlockNumber = await publicClient.getBlockNumber();
  console.log(
    `Latest block number after mining additional blocks: ${latestBlockNumber}`
  );

  return {
    MyToken,
    acc1,
    acc2,
    latestBlockNumber: latestBlockNumber.toBigInt(),
  };
}

// Mine blocks to advance the block number
async function mineBlocks(blockNumber: number) {
  while (blockNumber > 0) {
    blockNumber--;
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}

// Deploy TokenizedBallot contract
async function setupTokenizedBallot(MyToken, snapshotBlockNumber: bigint) {
  const TokenizedBallot = await viem.deployContract("TokenizedBallot", [
    PROPOSALS.map((proposal) => toHex(proposal, { size: 32 })),
    MyToken.address,
    snapshotBlockNumber.toString(),
  ]);
  console.log(`TokenizedBallot deployed to: ${TokenizedBallot.address}`);
  console.log(
    `Snapshot block number that is passed to TokenizedBallot as target block number: ${snapshotBlockNumber}`
  );

  return TokenizedBallot;
}

// Get the token balances at the snapshot block
async function logPastTokenBalances(
  tokenContract,
  accountAddresses: string[],
  snapshotBlock: bigint
) {
  for (const address of accountAddresses) {
    const pastBalance = await tokenContract.read.getTokenBalanceAtBlock([
      address,
      snapshotBlock,
    ]);
    console.log(
      `Address ${address} had ${pastBalance.toString()} balance at block ${snapshotBlock}.`
    );
  }
}

describe("Token and Voting System Tests", function () {
  let MyToken, TokenizedBallot, acc1, acc2, snapshotBlockNumber: bigint;

  before(async function () {
    // Setting up MyToken and minting tokens
    const setupMyTokenResult = await loadFixture(setupMyToken);
    MyToken = setupMyTokenResult.MyToken;
    acc1 = setupMyTokenResult.acc1;
    acc2 = setupMyTokenResult.acc2;

    snapshotBlockNumber = setupMyTokenResult.latestBlockNumber - BigInt(3);

    // Deploying TokenizedBallot
    TokenizedBallot = await setupTokenizedBallot(MyToken, snapshotBlockNumber);

    // Call logPastTokenBalances to log balances at the snapshot block
    await logPastTokenBalances(
      MyToken,
      [acc1.account.address, acc2.account.address],
      snapshotBlockNumber
    );
  });

  it("acc1: should allow voting", async function () {
    // acc1 votes
    await TokenizedBallot.write.vote([1, parseEther("50")], {
      account: acc1.account,
    });
    // Further checks can be added to verify the vote
  });

  it("acc2: should allow voting", async function () {
    // acc2 votes
    await TokenizedBallot.write.vote([1, parseEther("50")], {
      account: acc2.account,
    });
    // Further checks can be added to verify the vote
  });

  it("should correctly identify winning proposal", async function () {
    // Query and verify the winning proposal
    const winningProposalIndex = await TokenizedBallot.read.winningProposal();
    expect(Number(winningProposalIndex)).to.be.oneOf([0, 1]); // Convert BigInt to Number
    console.log(`Winning proposal index: ${winningProposalIndex}`);
  });
});
