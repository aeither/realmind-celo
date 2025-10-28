source .env
rm -rf cache out
forge build

# Replace with your deployed ChickenGame contract address
CHICKENGAME_ADDRESS="0x7147fC4382a87D772E8667A2f9322ce471A1912E"
EGG_TOKEN_ADDRESS="0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A"

# Sourcify
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --constructor-args $(cast abi-encode "constructor(address)" "$EGG_TOKEN_ADDRESS") \
  $CHICKENGAME_ADDRESS \
  src/ChickenGame.sol:ChickenGame

# Etherscan (Celoscan)
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "$EGG_TOKEN_ADDRESS") \
  $CHICKENGAME_ADDRESS \
  src/ChickenGame.sol:ChickenGame

# Blockscout
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  --constructor-args $(cast abi-encode "constructor(address)" "$EGG_TOKEN_ADDRESS") \
  $CHICKENGAME_ADDRESS \
  src/ChickenGame.sol:ChickenGame
