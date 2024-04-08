import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { abi } from "../artifacts/contracts/MyToken.sol/MyToken.json";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const delegeteePrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
};

const loadArgs = (): {
  tokenContractAddress: `0x${string}`;
  delegateeAddress: `0x${string}`;
} => {
  if (process.argv.length != 4) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/DelegateTokens.ts " +
        "<tokenContractAddress> <delegatee> "
    );
  }
  const tokenContractAddress = process.argv[2] as `0x${string}`;
  validateAddress(tokenContractAddress);
  const delegateeAddress = process.argv[3] as `0x${string}`;
  validateAddress(delegateeAddress);

  return {
    tokenContractAddress: tokenContractAddress,
    delegateeAddress: delegateeAddress,
  };
};

async function main() {
  const { tokenContractAddress, delegateeAddress } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${delegeteePrivateKey}`);
  const delegatee = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  console.log("delegatee address:", delegatee.account.address);
  const balance = await publicClient.getBalance({
    address: delegatee.account.address,
  });
  console.log(
    "delegatee balance:",
    formatEther(balance),
    delegatee.chain.nativeCurrency.symbol
  );

  console.log("Confirm? (Y/n)");
  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await delegatee.writeContract({
        address: tokenContractAddress,
        abi: abi,
        functionName: "delegate",
        args: [delegateeAddress as `0x${string}`],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Delegate successful", receipt.transactionHash);
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
