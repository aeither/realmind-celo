# Deploy Contracts (Celo Only)

## Setup
```bash
# Create .env file
echo "PRIVATE_KEY=your_private_key" > .env
```

## Deploy All Contracts

### 1. QuizGame + Token1
```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/QuizGame.s.sol:QuizGameScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```

### 2. BunnyGame Suite
```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/BunnyGame.s.sol:BunnyGameScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```

### 3. SeasonReward
```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/SeasonReward.s.sol:SeasonRewardScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```

## Post-Deployment

### Fund SeasonReward (250 CELO)
```bash
source .env && SEASON_REWARD_ADDRESS=0x... FUND_AMOUNT=250000000000000000000 forge script --chain 42220 script/SeasonReward.s.sol:FundSeasonRewardScript --rpc-url https://forno.celo.org --broadcast -vvvv --private-key ${PRIVATE_KEY}
```

### Process & Upload Rewards
```bash
# 1. Export holders.csv from block explorer
# 2. Process rewards
npx tsx scripts/process-rewards.ts --input scripts/holders.csv --output scripts/rewards --chain 42220

# 3. Upload to contract (edit contract address first)
npx tsx scripts/upload-rewards.ts --input scripts/rewards.csv --contract 0xYOUR_SEASON_REWARD_ADDRESS --format foundry

# 4. run script
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/SetSeasonRewards.s.sol:SetSeasonRewardsScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```

### End Season & Withdraw
```bash
# End distribution
cast send --rpc-url https://forno.celo.org --private-key ${PRIVATE_KEY} 0xYOUR_SEASON_REWARD_ADDRESS "endDistribution()"

# Withdraw unclaimed
cast send --rpc-url https://forno.celo.org --private-key ${PRIVATE_KEY} 0xYOUR_SEASON_REWARD_ADDRESS "withdraw()"
```

## Update Frontend

### 1. Regenerate ABIs
```bash
npx tsx scripts/fetchABI.ts
```

### 2. Update Contract Addresses
Edit `src/libs/constants.ts` with deployed addresses.
