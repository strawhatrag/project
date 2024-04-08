import {
  abi,
  bytecode,
} from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Contract address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address))
    throw new Error("Invalid contract address");
};

const loadArgs = (): {
  tokenContractAddress: `0x${string}`;
  proposals: string[];
} => {
  if (process.argv.length < 4) {
    throw new Error(
      "Usage: npx ts-node --files ./scripts/DeployBallotContracts.ts " +
        "<tokenContractAddress> <...proposals>"
    );
  }

  const tokenContractAddress = process.argv.at(2) as `0x${string}`;
  validateAddress(tokenContractAddress);

  const proposals = process.argv.slice(3);
  if (!proposals || proposals.length < 1)
    throw new Error("Proposals not provided");

  return {
    tokenContractAddress,
    proposals,
  };
};

async function main() {
  const { tokenContractAddress, proposals } = loadArgs();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  console.log("Deployer address:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });

  console.log(
    "Deployer balance:",
    formatEther(balance),
    deployer.chain.nativeCurrency.symbol
  );

  console.log("\nDeploying TokenizedBallot contract", {
    proposals,
    tokenContractAddress,
  });

  console.log("Confirm? (Y/n)");

  const stdin = process.openStdin();
  stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() !== "n") {
      const hash = await deployer.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args: [
          proposals.map((prop) => toHex(prop, { size: 32 })),
          tokenContractAddress,
          0,
        ],
      });

      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) throw new Error("Contract not deployed");

      console.log(
        "TokenizedBallot contract deployed to:",
        receipt.contractAddress
      );
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
