# Project Deployment Documentation

## Overview

This README provides the necessary commands and steps to deploy smart contracts using the provided scripts. It includes instructions for deploying a token contract, a tokenized ballot contract, and managing voting rights.

## Prerequisites

- Node.js and npm installed
- TypeScript installed globally
- Ethereum wallet with ETH for deploying contracts

## Deployment Steps

### Deploy Token

To deploy the MyToken contract, run the following command:

```shell
npx ts-node --files ./scripts/Deploy.ts

Output:


Deploying...
Deployer address: 0x239Cc31D5e1225e90AD6BD561aE89772660C557c
Deployer balance: 1.669005365499017391 ETH

Deploying MyToken contract
Transaction hash: 0x3ef95aff1d03b316da3511defacb55f9344c64dcbdecc307efb1e620a4c4c34e
Waiting for confirmations...
MyToken contract deployed to: 0x76e0a5de031837029626eb53f3eb2e95bfb19102

Deploy Ballot

To deploy the TokenizedBallot contract, use the following command with the token contract address and proposal names as arguments:


npx ts-node --files ./scripts/TokenizedBallot.ts 0x76e0a5de031837029626eb53f3eb2e95bfb19102 "godzilla" "king kong"

Output:


Deployer address: 0x239Cc31D5e1225e90AD6BD561aE89772660C557c
Deployer balance: 1.665243447526487227 ETH

Deploying TokenizedBallot contract...
Confirm? (Y/n)
y
Transaction hash: 0xfa34845eb0a4a637fb02e9acf14f16a1e53de520b0054a5303b038a8499dd5e3
Waiting for confirmations...
TokenizedBallot contract deployed to: 0x3cdbe0050b00d791189b03bdd32fb4342a0db8be

Check Voting Rights

To check the voting power of an account, execute the following command:


npx ts-node --files ./scripts/CheckVotingPower.ts 0x76e0a5de031837029626eb53f3eb2e95bfb19102 0x239Cc31D5e1225e90AD6BD561aE89772660C557c

Output:


Account 0x239Cc31D5e1225e90AD6BD561aE89772660C557c has 0 units of voting power

Give Voting Rights

To give voting rights to an account, use the following command with the token contract address, recipient address, and the number of tokens:


npx ts-node --files ./scripts/GiveVotingTokens.ts 0x76e0a5de031837029626eb53f3eb2e95bfb19102 0x239Cc31D5e1225e90AD6BD561aE89772660C557c 100

Output:


Minting 100 tokens to 0x239Cc31D5e1225e90AD6BD561aE89772660C557c
Confirm? (Y/n)
y
Transaction hash: 0x94a23af98172002fafc426faba4f51516c2644d485bd810d954d68e5dc3abb7e
Waiting for confirmations...
Mint successful...

Notes

Ensure you have sufficient ETH balance for contract deployment.
Confirm each transaction in your Ethereum wallet when prompted.
Check the transaction hash on an Ethereum blockchain explorer for confirmation status.

Conclusion

Following these steps will allow you to deploy and manage your smart contracts on the Ethereum network. For further assistance or more complex deployment scenarios, consult the official Ethereum documentation or seek support from the Ethereum development community.



Please replace the shell command placeholders with the actual commands you would use in your environment. The outputs provided are based on the example deployment process you've shared.




