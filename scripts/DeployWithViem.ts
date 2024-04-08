import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi, bytecode } from "../artifacts/contracts/MyToken.sol/MyToken.json";
import {
  abi as abiBallot,
  bytecode as bytecodeBallot,
} from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import * as dotenv from "dotenv";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

async function main() {
  const params = process.argv.slice(2);
  if (!params || params.length < 1) throw new Error("Params not provided");
  const tokenName = params[0];
  const tokenSymbol = params[1];
  const proposals = params.slice(2);
  let tokenContractAddress: `0x${string}` | null = null;

  const publicClient = await createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = await createWalletClient({
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

  console.log(`Deploying contract for token ${tokenName} (${tokenSymbol})`);
  console.log("Confirm? (Y/n)");
  const stdin = process.openStdin();
  stdin.once("data", async function (d) {
    if (d.toString().trim().toLowerCase() != "n") {
      console.log("\nDeploying MyToken contract...");
      const hash = await deployer.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args: [tokenName, tokenSymbol],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      tokenContractAddress = receipt.contractAddress!;
      console.log("MyToken contract deployed to:", tokenContractAddress);
    } else {
      console.log("Operation cancelled");
    }

    console.log(
      `Deploying contract TokenizedBallot with Token on address ${tokenContractAddress} and proposals ${proposals.map(
        (prop) => prop + " "
      )}`
    );
    console.log("Confirm? (Y/n)");

    stdin.once("data", async function (d) {
      if (d.toString().trim().toLowerCase() != "n") {
        console.log("\nDeploying TokenizedBallot contract...");
        const hash = await deployer.deployContract({
          abi: abiBallot,
          bytecode: bytecodeBallot as `0x${string}`,
          args: [
            proposals.map((prop) => toHex(prop, { size: 32 })),
            tokenContractAddress,
            tokenName,
          ],
        });
        console.log("Transaction hash:", hash);
        console.log("Waiting for confirmations...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(
          "TokenizedBallot contract deployed to:",
          receipt.contractAddress
        );
      } else {
        console.log("Operation cancelled");
      }

      process.exit();
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
