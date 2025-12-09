#!/usr/bin/env npx ts-node
/**
 * ETL Script: Process CSV from block explorer and calculate rewards
 *
 * Input: Raw CSV from block explorer with columns:
 *   Rank, Address, Address_Nametag, Quantity, Percentage, Value
 *
 * Output: Processed CSV ready for contract upload with columns:
 *   Address, Score, RewardAmount (in wei)
 *
 * Usage:
 *   npx ts-node scripts/process-rewards.ts --input holders.csv --output rewards.csv --chain 42220
 */

import * as fs from 'fs';
import * as path from 'path';
import { getRewardsConfig } from '../src/libs/constants';

// Helper to get rewards config in the format needed for this script
const getProcessRewardsConfig = (chainId: number) => {
  const config = getRewardsConfig(chainId);
  return {
    totalReward: config.totalReward,
    currency: config.currency,
    maxWinners: config.maxWinners
  };
};

interface RawHolder {
  rank: number;
  address: string;
  addressNametag: string;
  quantity: number;
  percentage: number;
  value: string;
}

interface ProcessedReward {
  address: string;
  score: string;
  rewardAmount: string; // in wei (18 decimals)
  rewardReadable: string; // human readable
}

// Round down to a fixed number of decimals to avoid overpaying
const roundDown = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
};

function parseCSV(content: string): RawHolder[] {
  const lines = content.trim().split('\n');
  const holders: RawHolder[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV with quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    if (fields.length >= 5) {
      // Parse quantity (remove commas)
      const quantityStr = fields[3].replace(/,/g, '');
      const quantity = parseFloat(quantityStr);
      
      holders.push({
        rank: parseInt(fields[0]) || i,
        address: fields[1].toLowerCase(),
        addressNametag: fields[2],
        quantity: quantity,
        percentage: parseFloat(fields[4].replace('%', '')) || 0,
        value: fields[5] || ''
      });
    }
  }
  
  return holders;
}

function processRewards(holders: RawHolder[], chainId: number): ProcessedReward[] {
  const config = getProcessRewardsConfig(chainId);

  console.log(`\n📊 Processing rewards for chain ${chainId} (${config.currency})`);
  console.log(`   Total reward pool: ${config.totalReward} ${config.currency}`);
  console.log(`   Max winners: ${config.maxWinners}`);
  console.log(`   Total holders in CSV: ${holders.length}`);
  
  // Sort by quantity (score) descending
  const sortedHolders = [...holders].sort((a, b) => b.quantity - a.quantity);
  
  // Take only top N winners
  const eligibleHolders = sortedHolders.slice(0, Math.min(sortedHolders.length, config.maxWinners));
  
  console.log(`   Eligible winners: ${eligibleHolders.length}`);
  
  // Calculate total score of eligible holders
  const totalScore = eligibleHolders.reduce((sum, h) => sum + h.quantity, 0);
  console.log(`   Total score of winners: ${totalScore.toFixed(2)}`);
  
  // Calculate proportional rewards
  const processed: ProcessedReward[] = [];
  let totalDistributed = BigInt(0);
  
  for (const holder of eligibleHolders) {
    // Skip zero balances
    if (holder.quantity <= 0) continue;
    
    // Calculate proportion: (user_score / total_score) * total_reward
    const proportion = holder.quantity / totalScore;
    const rewardAmount = config.totalReward * proportion;
    const rewardRounded = roundDown(rewardAmount, 2); // round down to 2 decimals
    
    // Convert to wei (18 decimals)
    const rewardWei = BigInt(Math.floor(rewardRounded * 1e18));
    totalDistributed += rewardWei;
    
    processed.push({
      address: holder.address,
      score: holder.quantity.toString(),
      rewardAmount: rewardWei.toString(),
      rewardReadable: rewardRounded.toFixed(2)
    });
  }
  
  console.log(`   Total to distribute: ${(Number(totalDistributed) / 1e18).toFixed(6)} ${config.currency}`);
  
  return processed;
}

function generateCSV(rewards: ProcessedReward[]): string {
  const header = 'Address,Score,RewardWei,RewardReadable';
  const rows = rewards.map(r => `${r.address},${r.score},${r.rewardAmount},${r.rewardReadable}`);
  return [header, ...rows].join('\n');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let inputFile = '';
  let outputFile = '';
  let chainId = 42220; // Default to Celo
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (args[i] === '--chain' && args[i + 1]) {
      chainId = parseInt(args[i + 1]);
      i++;
    }
  }
  
  if (!inputFile) {
    console.log(`
ETL Script: Process block explorer CSV to reward distribution

Usage:
  npx ts-node scripts/process-rewards.ts --input <csv_file> --output <output_file> --chain <chain_id>

Options:
  --input   Input CSV file from block explorer
  --output  Output file (will generate both .csv and .json)
  --chain   Chain ID (default: 42220 for Celo)
            Supported: 8453 (Base), 42220 (Celo), 41923 (EDU Chain)

Example:
  npx ts-node scripts/process-rewards.ts --input holders.csv --output rewards --chain 42220
`);
    process.exit(1);
  }
  
  // Read input CSV
  console.log(`\n📂 Reading input: ${inputFile}`);
  const csvContent = fs.readFileSync(inputFile, 'utf-8');
  
  // Parse CSV
  const holders = parseCSV(csvContent);
  console.log(`   Parsed ${holders.length} holders`);
  
  // Process rewards
  const rewards = processRewards(holders, chainId);
  
  // Generate output
  const baseName = outputFile || path.basename(inputFile, '.csv') + '_processed';

  // Write CSV only
  const csvOutput = generateCSV(rewards);
  const csvPath = baseName.endsWith('.csv') ? baseName : baseName + '.csv';
  fs.writeFileSync(csvPath, csvOutput);
  console.log(`\n✅ CSV written to: ${csvPath}`);
  
  // Print summary
  console.log(`\n📋 Summary:`);
  console.log(`   Recipients: ${rewards.length}`);
  if (rewards.length > 0) {
    console.log(`   Top 5 rewards:`);
    rewards.slice(0, 5).forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.address.slice(0, 10)}... : ${r.rewardReadable}`);
    });
  }
}

main();







