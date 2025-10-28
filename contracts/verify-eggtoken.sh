source .env
rm -rf cache out
forge build

# Sourcify
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A \
  src/ChickenGame.sol:EggToken

# Etherscan (Celoscan)
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A \
  src/ChickenGame.sol:EggToken

# Blockscout
forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  0x252Cf4eF66DB38ac1C53f05ccF5dc0f90331151A \
  src/ChickenGame.sol:EggToken
