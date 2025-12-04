#!/usr/bin/env npx ts-node
/**
 * Upload Script: Set rewards on SeasonReward contract from processed JSON
 * 
 * This script reads the processed rewards JSON and generates a Foundry script
 * or directly calls the contract to set rewards.
 * 
 * Usage:
 *   npx ts-node scripts/upload-rewards.ts --input rewards.json --contract 0x... --chain 42220
 *   
 * Or generate Foundry script:
 *   npx ts-node scripts/upload-rewards.ts --input rewards.json --output set-rewards.s.sol
 */

import * as fs from 'fs';
import * as path from 'path';

interface RewardsData {
  generatedAt: string;
  totalRecipients: number;
  rewards: Array<{
    address: string;
    amount: string;
    amountReadable: string;
  }>;
}

const CHUNK_SIZE = 100; // Process rewards in batches to avoid gas limits

function readRewardsJSON(filePath: string): RewardsData {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as RewardsData;
}

function generateFoundryScript(data: RewardsData, contractAddress: string): string {
  const chunks: Array<{ addresses: string[]; amounts: string[] }> = [];

  // Split into chunks
  for (let i = 0; i < data.rewards.length; i += CHUNK_SIZE) {
    const chunk = data.rewards.slice(i, i + CHUNK_SIZE);
    chunks.push({
      addresses: chunk.map(r => r.address),
      amounts: chunk.map(r => r.amount)
    });
  }

  // Calculate total for funding
  const totalWei = data.rewards.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));
  const totalEther = Number(totalWei) / 1e18;

  let script = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SeasonReward} from "../src/SeasonReward.sol";

/**
 * @title SetSeasonRewardsScript
 * @notice Generated script to set rewards on SeasonReward contract
 * @dev Generated at: ${data.generatedAt}
 *      Total recipients: ${data.totalRecipients}
 *      Total amount: ${totalEther.toFixed(6)} native tokens
 */
contract SetSeasonRewardsScript is Script {
    SeasonReward public seasonReward;

    function setUp() public {
        seasonReward = SeasonReward(payable(${contractAddress}));
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Setting rewards on SeasonReward at:", address(seasonReward));
        console.log("Total recipients:", ${data.totalRecipients});
`;

  // Add batch calls
  chunks.forEach((chunk, index) => {
    script += `
        // Batch ${index + 1} of ${chunks.length}
        {
            address[] memory users = new address[](${chunk.addresses.length});
            uint256[] memory amounts = new uint256[](${chunk.amounts.length});
`;

    chunk.addresses.forEach((addr, i) => {
      script += `            users[${i}] = ${addr};\n`;
    });

    chunk.amounts.forEach((amt, i) => {
      script += `            amounts[${i}] = ${amt};\n`;
    });

    script += `
            seasonReward.setSeasonRewards(users, amounts);
            console.log("Batch ${index + 1} complete: ${chunk.addresses.length} recipients");
        }
`;
  });

  script += `
        console.log("\\n=== Rewards Set Successfully ===");
        console.log("Total recipients:", ${data.totalRecipients});
        console.log("Remember to fund the contract with at least ${totalEther.toFixed(6)} native tokens");

        vm.stopBroadcast();
    }
}
`;

  return script;
}

function generateCastCommands(data: RewardsData, contractAddress: string): string {
  const chunks: Array<{ addresses: string[]; amounts: string[] }> = [];

  for (let i = 0; i < data.rewards.length; i += CHUNK_SIZE) {
    const chunk = data.rewards.slice(i, i + CHUNK_SIZE);
    chunks.push({
      addresses: chunk.map(r => r.address),
      amounts: chunk.map(r => r.amount)
    });
  }

  let commands = `#!/bin/bash
# Generated Cast commands to set rewards
# Generated at: ${data.generatedAt}
# Total recipients: ${data.totalRecipients}
# Contract: ${contractAddress}

set -e

CONTRACT="${contractAddress}"

`;

  chunks.forEach((chunk, index) => {
    // Format arrays for cast
    const addressArray = `[${chunk.addresses.join(',')}]`;
    const amountArray = `[${chunk.amounts.join(',')}]`;

    commands += `
# Batch ${index + 1} of ${chunks.length} (${chunk.addresses.length} recipients)
echo "Processing batch ${index + 1}..."
cast send $CONTRACT "setSeasonRewards(address[],uint256[])" '${addressArray}' '${amountArray}' --private-key $PRIVATE_KEY --rpc-url $RPC_URL

`;
  });

  commands += `
echo "\\n=== All batches complete ==="
echo "Total recipients: ${data.totalRecipients}"
`;

  return commands;
}

function generateAddressesAndAmounts(data: RewardsData): { addresses: string; amounts: string } {
  return {
    addresses: data.rewards.map(r => r.address).join('\n'),
    amounts: data.rewards.map(r => r.amount).join('\n')
  };
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  let inputFile = '';
  let outputFile = '';
  let contractAddress = '0x0000000000000000000000000000000000000000';
  let format = 'foundry'; // foundry, cast, or raw

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--contract' && args[i + 1]) {
      contractAddress = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1];
      i++;
    }
  }

  if (!inputFile) {
    console.log(`
Upload Script: Generate contract calls from processed rewards JSON

Usage:
  npx ts-node scripts/upload-rewards.ts --input <json_file> --contract <address> [--output <file>] [--format <type>]

Options:
  --input     Input JSON file from process-rewards.ts
  --contract  SeasonReward contract address
  --output    Output file (optional)
  --format    Output format: foundry (default), cast, or raw

Examples:
  # Generate Foundry script
  npx ts-node scripts/upload-rewards.ts --input rewards.json --contract 0x123... --output SetRewards.s.sol
  
  # Generate cast commands
  npx ts-node scripts/upload-rewards.ts --input rewards.json --contract 0x123... --format cast --output set-rewards.sh
`);
    process.exit(1);
  }

  console.log(`\n📂 Reading rewards: ${inputFile}`);
  const data = readRewardsJSON(inputFile);
  console.log(`   Found ${data.totalRecipients} recipients`);
  console.log(`   Generated at: ${data.generatedAt}`);

  // Calculate total
  const totalWei = data.rewards.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));
  const totalEther = Number(totalWei) / 1e18;
  console.log(`   Total rewards: ${totalEther.toFixed(6)} native tokens`);

  let output: string;
  let defaultExt: string;

  switch (format) {
    case 'cast':
      output = generateCastCommands(data, contractAddress);
      defaultExt = '.sh';
      break;
    case 'raw':
      const raw = generateAddressesAndAmounts(data);
      fs.writeFileSync(outputFile ? outputFile + '_addresses.txt' : 'addresses.txt', raw.addresses);
      fs.writeFileSync(outputFile ? outputFile + '_amounts.txt' : 'amounts.txt', raw.amounts);
      console.log(`\n✅ Raw files written`);
      return;
    default:
      output = generateFoundryScript(data, contractAddress);
      defaultExt = '.s.sol';
  }

  if (outputFile) {
    const finalPath = outputFile.includes('.') ? outputFile : outputFile + defaultExt;
    fs.writeFileSync(finalPath, output);
    console.log(`\n✅ Output written to: ${finalPath}`);
  } else {
    console.log(`\n--- Generated Output ---\n`);
    console.log(output);
  }

  console.log(`\n📋 Next steps:`);
  console.log(`   1. Fund the contract with at least ${totalEther.toFixed(6)} native tokens`);
  console.log(`   2. Run the generated script/commands`);
  console.log(`   3. Verify rewards are set correctly`);
}

main();



