# Smart Contract Verification Guide

This guide explains how to verify your deployed smart contracts on block explorers using the automated verification script.

## Overview

The `verify-contracts.sh` script automates the verification process for all deployed contracts across:
- Base Mainnet
- Celo Mainnet
- EDU Chain

## Deployed Contracts

### Base Mainnet (Chain ID: 8453)
- **Token1**: `0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121`
- **QuizGame**: `0x25D79A35F6323D0d3EE617549Cc507ED6B9639Cb`
- **SeasonReward**: `0x47358AF939cdB5B2b79a1AEE7d9E02760b2b73b2`

### Celo Mainnet (Chain ID: 42220)
- **Token1**: `0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7`
- **QuizGame**: `0x367c011DC980E695EdE1e314af0a82C7E2b01e3B`

### EDU Chain (Chain ID: 41923)
- **Token1**: `0x57AED70DA2c288E4a79D2ca797ED9B276db47793`
- **QuizGame**: `0x5A65590851b40939830cB5Ced3dEe8A0051cEDb7`

## Prerequisites

1. **Foundry**: Make sure Foundry is installed
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **API Keys** (Optional but recommended): Set up your explorer API keys in `.env` file:
   ```bash
   # For Base Mainnet - Basescan (Etherscan-compatible, recommended)
   BASESCAN_API_KEY=your_basescan_api_key_here

   # For Celo Mainnet - Celoscan (Etherscan-compatible, recommended)
   CELOSCAN_API_KEY=your_celoscan_api_key_here

   # EDU Chain uses Blockscout - no API key required
   ```

### Getting API Keys

#### Basescan (for Base Mainnet) - Recommended
1. Go to https://basescan.org/
2. Sign up for an account
3. Navigate to API-KEYs section
4. Generate a new API key
5. Add to `.env`: `BASESCAN_API_KEY=your_key_here`

**Alternative**: If no API key is provided, the script will automatically use Base Blockscout (https://base.blockscout.com) which doesn't require an API key.

#### Celoscan (for Celo Mainnet) - Recommended
1. Go to https://celoscan.io/
2. Sign up for an account
3. Navigate to API-KEYs section
4. Generate a new API key
5. Add to `.env`: `CELOSCAN_API_KEY=your_key_here`

**Alternative**: If no API key is provided, the script will automatically use Celo Explorer Blockscout (https://explorer.celo.org) which doesn't require an API key.

#### EDU Chain
EDU Chain uses Blockscout (https://educhain.blockscout.com) which does not require an API key for verification.

## Usage

### Verify All Contracts on All Networks

```bash
cd contracts
./verify-contracts.sh all
```

### Verify Contracts on Specific Network

```bash
# Base Mainnet only
./verify-contracts.sh base

# Celo Mainnet only
./verify-contracts.sh celo

# EDU Chain only
./verify-contracts.sh edu
```

## What the Script Does

The script intelligently selects the best verification method for each network:

### Base Mainnet
- **With BASESCAN_API_KEY**: Uses Basescan (Etherscan-compatible) - fastest and most reliable
- **Without API key**: Automatically falls back to Base Blockscout (no auth required)

### Celo Mainnet
- **With CELOSCAN_API_KEY**: Uses Celoscan (Etherscan-compatible) - fastest and most reliable
- **Without API key**: Automatically falls back to Celo Explorer Blockscout (no auth required)

### EDU Chain
- Always uses EDU Chain Blockscout (no API key required)

For each network, the script will:

1. **Verify Token1 Contract**
   - Encodes constructor arguments (token name and symbol)
   - Submits verification using appropriate verifier
   - Provides explorer link

2. **Verify QuizGame Contract**
   - Encodes constructor argument (Token1 address)
   - Submits verification using appropriate verifier
   - Provides explorer link

3. **Verify SeasonReward Contract** (Base only)
   - Submits verification (no constructor args needed)
   - Provides explorer link

## Expected Output

The script provides colorized output:
- **Blue [INFO]**: Information messages
- **Green [SUCCESS]**: Successful verification
- **Yellow [WARNING]**: Already verified or non-critical issues
- **Red [ERROR]**: Critical errors (missing API keys, etc.)

Example:
```
========================================
Verifying Base Mainnet Contracts
========================================

[INFO] Verifying Token1 contract at 0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121
[SUCCESS] Token1 verified successfully!
[INFO] View on explorer: https://basescan.org/address/0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121#code
```

## Troubleshooting

### "Already verified" message
This is normal if the contract was previously verified. The script will continue with other contracts.

### API Key errors
- Check that your `.env` file exists in the `contracts/` directory
- Verify API keys are correct and have proper permissions
- Ensure no extra spaces or quotes around API keys

### Verification timeout
- Network congestion may cause delays
- Wait a few minutes and check the explorer directly
- The contract may still verify even if the script times out

### EDU Chain verification issues
EDU Chain uses Blockscout which has different verification behavior. If automatic verification fails:
1. Visit https://educhain.blockscout.com
2. Navigate to your contract address
3. Use the "Verify & Publish" option in the UI
4. Upload your contract source code manually

## Manual Verification (Alternative)

If the script fails, you can verify manually using forge:

### Base Mainnet

**Option 1: Using Basescan (Etherscan-compatible, recommended)**

```bash
# Token1
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121 \
  src/QuizGame.sol:Token1

# QuizGame
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121") \
  0x25D79A35F6323D0d3EE617549Cc507ED6B9639Cb \
  src/QuizGame.sol:QuizGame

# SeasonReward
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key $BASESCAN_API_KEY \
  0x47358AF939cdB5B2b79a1AEE7d9E02760b2b73b2 \
  src/SeasonReward.sol:SeasonReward
```

**Option 2: Using Base Blockscout (no API key required)**

```bash
# Token1
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --verifier blockscout \
  --verifier-url https://base.blockscout.com/api \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121 \
  src/QuizGame.sol:Token1

# QuizGame
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --verifier blockscout \
  --verifier-url https://base.blockscout.com/api \
  --constructor-args $(cast abi-encode "constructor(address)" "0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121") \
  0x25D79A35F6323D0d3EE617549Cc507ED6B9639Cb \
  src/QuizGame.sol:QuizGame
```

### Celo Mainnet

**Option 1: Using Celoscan (Etherscan-compatible, recommended)**

```bash
# Token1
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1

# QuizGame
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7") \
  0x367c011DC980E695EdE1e314af0a82C7E2b01e3B \
  src/QuizGame.sol:QuizGame
```

**Option 2: Using Celo Explorer Blockscout (no API key required)**

```bash
# Token1
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url https://explorer.celo.org/mainnet/api \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1

# QuizGame
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url https://explorer.celo.org/mainnet/api \
  --constructor-args $(cast abi-encode "constructor(address)" "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7") \
  0x367c011DC980E695EdE1e314af0a82C7E2b01e3B \
  src/QuizGame.sol:QuizGame
```

### EDU Chain

**Using EDU Chain Blockscout (no API key required)**

```bash
# Token1
forge verify-contract \
  --chain-id 41923 \
  --rpc-url https://rpc.edu-chain.raas.gelato.cloud \
  --verifier blockscout \
  --verifier-url https://educhain.blockscout.com/api \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0x57AED70DA2c288E4a79D2ca797ED9B276db47793 \
  src/QuizGame.sol:Token1

# QuizGame
forge verify-contract \
  --chain-id 41923 \
  --rpc-url https://rpc.edu-chain.raas.gelato.cloud \
  --verifier blockscout \
  --verifier-url https://educhain.blockscout.com/api \
  --constructor-args $(cast abi-encode "constructor(address)" "0x57AED70DA2c288E4a79D2ca797ED9B276db47793") \
  0x5A65590851b40939830cB5Ced3dEe8A0051cEDb7 \
  src/QuizGame.sol:QuizGame
```

## Constructor Arguments Reference

For reference, here are the constructor arguments for each contract:

### Token1
- **Constructor**: `constructor(string memory name, string memory symbol)`
- **Arguments**:
  - `name`: "XP Points"
  - `symbol`: "XP3"

### QuizGame
- **Constructor**: `constructor(address tokenAddress)`
- **Arguments**:
  - Base: `0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121`
  - Celo: `0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7`
  - EDU: `0x57AED70DA2c288E4a79D2ca797ED9B276db47793`

### SeasonReward
- **Constructor**: `constructor()`
- **Arguments**: None

## Block Explorer Links

After verification, view your contracts at:

### Base Mainnet
- **Basescan (Etherscan-compatible)**: https://basescan.org
- **Base Blockscout**: https://base.blockscout.com

### Celo Mainnet
- **Celoscan (Etherscan-compatible)**: https://celoscan.io
- **Celo Explorer (Blockscout)**: https://explorer.celo.org

### EDU Chain
- **EDU Chain Blockscout**: https://educhain.blockscout.com

## Notes

- Verification typically takes 1-5 minutes to appear on the explorer
- Contracts that are already verified will show a warning but won't fail the script
- The script uses the `--watch` flag to wait for verification completion
- All contract source code must be in the `src/` directory for verification to work

## Support

If you encounter issues:
1. Check that all contracts are compiled: `forge build`
2. Verify your `.env` file is properly configured
3. Ensure you're running the script from the `contracts/` directory
4. Check forge/cast versions: `forge --version` and `cast --version`
