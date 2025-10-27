source .env
rm -rf cache out
forge build

# Replace with your deployed QuizGame contract address
QUIZGAME_ADDRESS="0x367c011DC980E695EdE1e314af0a82C7E2b01e3B"
TOKEN1_ADDRESS="0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7"

# Sourcify
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --constructor-args $(cast abi-encode "constructor(address)" "$TOKEN1_ADDRESS") \
  $QUIZGAME_ADDRESS \
  src/QuizGame.sol:QuizGame

# Etherscan (Celoscan)
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "$TOKEN1_ADDRESS") \
  $QUIZGAME_ADDRESS \
  src/QuizGame.sol:QuizGame

# Blockscout
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  --constructor-args $(cast abi-encode "constructor(address)" "$TOKEN1_ADDRESS") \
  $QUIZGAME_ADDRESS \
  src/QuizGame.sol:QuizGame
