import {
  createPublicClient,
  createWalletClient,
  formatEther,
  hexToString,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { abi } from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const voterPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
};

const loadArgs = (): {
  ballotContractAddress: `0x${string}`;
  proposalNumber: bigint;
  amount: string;
} => {
  if (process.argv.length != 5) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/DeployBallotContracts.ts " +
        "<ballotContractAddress> <proposalNumber> <amount>"
    );
  }
  const ballotContractAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(ballotContractAddress);
  const proposalNumber = BigInt(process.argv.at(3) as string);
  const amount = process.argv.at(4);
  if (!amount) throw new Error("amount not provided");
  return {
    ballotContractAddress: ballotContractAddress,
    proposalNumber: proposalNumber,
    amount: amount,
  };
};

async function main() {
  const { ballotContractAddress, proposalNumber, amount } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${voterPrivateKey}`);
  const voter = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log("voter address:", voter.account.address);
  const balance = await publicClient.getBalance({
    address: voter.account.address,
  });
  console.log(
    "voter balance:",
    formatEther(balance),
    voter.chain.nativeCurrency.symbol
  );

  const proposalObj = (await publicClient.readContract({
    address: ballotContractAddress,
    abi,
    functionName: "proposals",
    args: [proposalNumber],
  })) as any;
  if (!proposalObj) {
    throw new Error("couldn't retrieve proposal");
  }
  const proposal = hexToString(proposalObj[0], { size: 32 });

  console.log(
    `\nVoting on proposal[${proposalNumber}] ${proposal} with ${amount} voting tokens`
  );

  console.log("Confirm? (Y/n)");
  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await voter.writeContract({
        address: ballotContractAddress,
        abi,
        functionName: "vote",
        args: [proposalNumber, parseEther(amount)],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Vote successful:", receipt.transactionHash);
    } else {
      console.log("Operation cancelled");
    }
    process.exit();
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
