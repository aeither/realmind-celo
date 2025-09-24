# 🚀 Smart Contract Deployment Guide

## Quick Deploy to Base Mainnet

### 1. Setup Environment
```bash
# Create .env file in contracts/ directory
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "BASE_RPC_URL=https://mainnet.base.org" >> .env
```

### 2. Deploy All Demo Contracts
```bash
cd contracts
forge script script/DeployDemoContracts.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 3. Update Frontend Contract Addresses

After deployment, update `src/libs/constants.ts` with the new addresses:

```typescript
const CONTRACT_ADDRESSES = {
  // Base Mainnet
  8453: {
    token1ContractAddress: "0x...", // From deployment output
    quizGameContractAddress: "0x...", // From deployment output
  }
}
```

### 4. Test Demo
```bash
cd ..
pnpm run dev
# Navigate to http://localhost:5173
```

## Alternative: Manual Deployment

If you prefer to deploy contracts individually:

### Deploy Token Contract
```bash
forge create src/Token1.sol:Token1 \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy Quiz Game Contract
```bash
forge create src/QuizGame.sol:QuizGame \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <TOKEN_ADDRESS> \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy Quiz Duel Contract
```bash
forge create src/QuizDuel.sol:QuizDuel \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <TOKEN_ADDRESS> \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy Guild System Contract
```bash
forge create src/GuildSystem.sol:GuildSystem \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <TOKEN_ADDRESS> \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Deploy Quiz NFT Contract
```bash
forge create src/QuizNFT.sol:QuizNFT \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args <TOKEN_ADDRESS> \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Base Mainnet Info 🔵

- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Alternative RPC**: https://base.llamarpc.com
- **Explorer**: https://basescan.org/
- **Currency Symbol**: ETH
- **Bridge**: https://bridge.base.org/

## Environment Variables Setup

Add to your `.env` file:

```bash
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Verification

After deployment, verify contracts on Basescan:

```bash
forge verify-contract <CONTRACT_ADDRESS> src/QuizGame.sol:QuizGame \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" <TOKEN_ADDRESS>)
```

## Gas Optimization Tips 💰

- Deploy during off-peak hours for lower gas fees
- Use `--optimize` flag: `--optimizer-runs 200`
- Consider using CREATE2 for deterministic addresses

```bash
forge create src/QuizGame.sol:QuizGame \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --optimize \
  --optimizer-runs 200
```

---

**Note**: Make sure you have ETH in your wallet for gas fees on Base Mainnet. Bridge from Ethereum L1 via the official Base bridge! 🌉

Perfect for your DailyWiser Web3 learning campaign deployment! 🎓✨