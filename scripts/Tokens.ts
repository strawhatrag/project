import { viem } from "hardhat";
import { parseEther } from "viem";

async function main() {
  const publicClient = await viem.getPublicClient();
  const [deployer, account1, account2] = await viem.getWalletClients();
  const tokenContract = await viem.deployContract("MyToken");
  console.log(`Contract deployed at ${tokenContract.address}`);
  const totalSupply = await tokenContract.read.totalSupply();
  console.log({ totalSupply });

  const code = await tokenContract.read.MINTER_ROLE();

  const mintTx = await tokenContract.write.mint(
    [deployer.account.address, parseEther("10")],
    { account: account2.account }
  );
  await publicClient.waitForTransactionReceipt({ hash: mintTx });

  // Giving role
  const roleTx = await tokenContract.write.grantRole([
    code,
    account2.account.address,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: roleTx });

  const [name, symbol, decimals, contractTotalSupply] = await Promise.all([
    tokenContract.read.name(),
    tokenContract.read.symbol(),
    tokenContract.read.decimals(),
    tokenContract.read.totalSupply(),
  ]);
  console.log({ name, symbol, decimals, contractTotalSupply });

  // Sending a transaction
  const tx = await tokenContract.write.transfer([
    account1.account.address,
    parseEther("2"),
  ]);
  await publicClient.waitForTransactionReceipt({ hash: tx });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
