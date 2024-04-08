import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  toHex,
  hexToString,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi, bytecode } from "../artifacts/contracts/MyToken.sol/MyToken.json";
import * as dotenv from "dotenv";
dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

const validateAddress = (address?: `0x${string}`) => {
  if (!address) throw new Error("Address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");
};

async function main() {
  const params = process.argv.slice(2);
  if (!params || params.length < 1) throw new Error("Params not provided");
  const tokenContractAddress = params[0] as `0x${string}`;
  const holderAddress = params[1] as `0x${string}`;
  validateAddress(tokenContractAddress);
  validateAddress(holderAddress);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const votingPower: bigint = (await publicClient.readContract({
    address: tokenContractAddress,
    abi,
    functionName: "getVotes",
    args: [holderAddress],
  })) as bigint;

  console.log(
    `Account ${holderAddress} has ${votingPower.toString()} units of voting power\n`
  );
}

main().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});
