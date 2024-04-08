import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { viem } from "hardhat";
import { abi, bytecode } from "../artifacts/contracts/MyToken.sol/MyToken.json";
dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const minterPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
};

const loadArgs = (): {
  tokenContractAddress: `0x${string}`;
  receiverAddress: `0x${string}`;
  amount: string;
} => {
  if (process.argv.length != 5) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/DeployBallotContracts.ts " +
        "<tokenContractAddress> <receiverAddress> <amount>"
    );
  }
  const tokenContractAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(tokenContractAddress);
  const receiverAddress = process.argv.at(3) as `0x${string}`;
  validateAddress(receiverAddress);
  const amount = process.argv.at(4);
  if (!amount) throw new Error("amount not provided");
  return {
    tokenContractAddress: tokenContractAddress,
    receiverAddress: receiverAddress,
    amount: amount,
  };
};

async function main() {
  const { tokenContractAddress, receiverAddress, amount } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${minterPrivateKey}`);
  const minter = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log("minter address:", minter.account.address);
  const balance = await publicClient.getBalance({
    address: minter.account.address,
  });
  console.log(
    "minter balance:",
    formatEther(balance),
    minter.chain.nativeCurrency.symbol
  );

  const tokenContract = await viem.getContractAt(
    "MyToken",
    tokenContractAddress
  );

  console.log(`\nMinting ${amount} tokens to ${receiverAddress}`);

  console.log("Confirm? (Y/n)");
  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await minter.writeContract({
        address: tokenContractAddress,
        abi,
        functionName: "mint",
        args: [receiverAddress, parseEther(amount)],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Mint successful", receipt);
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
