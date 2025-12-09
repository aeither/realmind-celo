#!/usr/bin/env npx ts-node
/**
 * Upload Script: Set rewards on SeasonReward contract from processed CSV
 *
 * This script reads the processed rewards CSV (from process-rewards.ts) and
 * generates a Foundry script, cast commands, or raw address/amount lists.
 *
 * Usage:
 *   npx ts-node scripts/upload-rewards.ts --input rewards.csv --contract 0x... --format foundry
 *
 * Or generate Foundry script:
 *   npx ts-node scripts/upload-rewards.ts --input rewards.csv --output set-rewards.s.sol
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAddress } from 'viem'; // ✅ Using viem instead of ethers

interface CsvRewardRow {
  address: string;
  amount: string;
  amountReadable: string;
}

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

// ✅ VIEM: Function to validate and checksum addresses
function checksumAddress(address: string): string {
  try {
    // Remove 0x prefix if present and validate it's a hex address
    const cleanAddress = address.toLowerCase().replace(/^0x/i, '');
    if (!/^[0-9a-f]{40}$/i.test(cleanAddress)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    // Use viem to get checksummed version
    return getAddress('0x' + cleanAddress);
  } catch (error) {
    console.error(`❌ Invalid address: ${address}`);
    throw error;
  }
}

function readCSV(filePath: string): RewardsData {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n');
  // Expect header: Address,Score,RewardWei,RewardReadable
  const rows: CsvRewardRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const [address, _score, rewardWei, rewardReadable] = line.split(',');

    const cleanAddress = address.trim();
    const checksummedAddress = checksumAddress(cleanAddress); // ✅ Validate & checksum with viem

    rows.push({
      address: checksummedAddress, // ✅ Use checksummed address
      amount: rewardWei.trim(),
      amountReadable: rewardReadable?.trim() || '0'
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRecipients: rows.length,
    rewards: rows.map(r => ({
      address: r.address,
      amount: r.amount,
      amountReadable: r.amountReadable
    }))
  };
}

function generateFoundryScript(data: RewardsData, contractAddress: string): string {
  // ✅ Ensure contract address is checksummed with viem
  const checksummedContract = checksumAddress(contractAddress);

  const chunks: Array<{ addresses: string[]; amounts: string[] }> = [];

  // Split into chunks
  for (let i = 0; i < data.rewards.length; i += CHUNK_SIZE) {
    const chunk = data.rewards.slice(i, i + CHUNK_SIZE);
    chunks.push({
      addresses: chunk.map(r => r.address), // ✅ Already checksummed
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
        seasonReward = SeasonReward(payable(${checksummedContract})); // ✅ Checksummed with viem
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Setting rewards on SeasonReward at:", address(seasonReward));
        console.log("Total recipients:", uint256(${data.totalRecipients}));
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
            console.log("Batch ${index + 1} complete:", uint256(${chunk.addresses.length}), "recipients");
        }
`;
  });

  script += `
        console.log("\\n=== Rewards Set Successfully ===");
        console.log("Total recipients:", uint256(${data.totalRecipients}));
        console.log("Remember to fund the contract with at least ${totalEther.toFixed(6)} native tokens");

        vm.stopBroadcast();
    }
}
`;

  return script;
}

function generateCastCommands(data: RewardsData, contractAddress: string): string {
  const checksummedContract = checksumAddress(contractAddress); // ✅ Checksum with viem

  const chunks: Array<{ addresses: string[]; amounts: string[] }> = [];

  for (let i = 0; i < data.rewards.length; i += CHUNK_SIZE) {
    const chunk = data.rewards.slice(i, i + CHUNK_SIZE);
    chunks.push({
      addresses: chunk.map(r => r.address), // ✅ Already checksummed
      amounts: chunk.map(r => r.amount)
    });
  }

  let commands = `#!/bin/bash
# Generated Cast commands to set rewards
# Generated at: ${data.generatedAt}
# Total recipients: ${data.totalRecipients}
# Contract: ${checksummedContract} # ✅ Checksummed with viem

set -e

CONTRACT="${checksummedContract}"

`;

  chunks.forEach((chunk, index) => {
    // Format arrays for cast (already checksummed)
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
    addresses: data.rewards.map(r => r.address).join('\n'), // ✅ Already checksummed with viem
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
Upload Script: Generate contract calls from processed rewards CSV

Usage:
  npx ts-node scripts/upload-rewards.ts --input <csv_file> --contract <address> [--output <file>] [--format <type>]

Options:
  --input     Input file from process-rewards.ts (csv only)
  --contract  SeasonReward contract address
  --output    Output file (optional)
  --format    Output format: foundry (default), cast, or raw

Examples:
  # Generate Foundry script
  npx ts-node scripts/upload-rewards.ts --input rewards.csv --contract 0x123... --output SetRewards.s.sol
  
  # Generate cast commands
  npx ts-node scripts/upload-rewards.ts --input rewards.csv --contract 0x123... --format cast --output set-rewards.sh
`);
    process.exit(1);
  }

  console.log(`\n📂 Reading rewards: ${inputFile}`);
  const data = readCSV(inputFile);
  console.log(`   ✅ Found ${data.totalRecipients} recipients (all addresses checksum validated with viem)`);
  console.log(`   Generated at: ${data.generatedAt}`);

  // Calculate total
  const totalWei = data.rewards.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0));
  const totalEther = Number(totalWei) / 1e18;
  console.log(`   Total rewards: ${totalEther.toFixed(6)} native tokens`);

  let output: string;
  let outputPath: string | undefined;

  switch (format) {
    case 'cast':
      output = generateCastCommands(data, contractAddress);
      if (outputFile) {
        outputPath = outputFile.includes('.') ? outputFile : outputFile + '.sh';
      }
      break;
    case 'raw':
      const raw = generateAddressesAndAmounts(data);
      fs.writeFileSync(outputFile ? outputFile + '_addresses.txt' : 'addresses.txt', raw.addresses);
      fs.writeFileSync(outputFile ? outputFile + '_amounts.txt' : 'amounts.txt', raw.amounts);
      console.log(`\n✅ Raw files written (addresses checksum validated with viem)`);
      return;
    default:
      output = generateFoundryScript(data, contractAddress);
      outputPath = outputFile
        ? (outputFile.includes('.') ? outputFile : outputFile + '.s.sol')
        : path.join('contracts', 'script', 'SetSeasonRewards.s.sol');
  }

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.log(`\n✅ Output written to: ${outputPath}`);
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
