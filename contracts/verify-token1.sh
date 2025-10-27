source .env
rm -rf cache out
forge build

# Sourcify
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1

# Etherscan (Celoscan)
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1

# Blockscout
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1
