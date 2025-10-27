## Verify Token1

**Etherscan (Celoscan):**
```bash
source .env && rm -rf cache out && forge build && forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1
```

**Blockscout:**
```bash
source .env && rm -rf cache out && forge build && forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string)" "XP Points" "XP3") \
  0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7 \
  src/QuizGame.sol:Token1
```

---

## Verify QuizGame

**Etherscan (Celoscan):**
```bash
source .env && rm -rf cache out && forge build && forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier etherscan \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7") \
  0x367c011DC980E695EdE1e314af0a82C7E2b01e3B \
  src/QuizGame.sol:QuizGame
```

**Blockscout:**
```bash
source .env && rm -rf cache out && forge build && forge verify-contract \
  --chain-id 42220 \
  --rpc-url https://forno.celo.org \
  --verifier blockscout \
  --verifier-url "https://celo.blockscout.com/api" \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7") \
  0x367c011DC980E695EdE1e314af0a82C7E2b01e3B \
  src/QuizGame.sol:QuizGame
```

---

## Contract Details

- **Token1 Address**: `0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7`
- **QuizGame Address**: `0x367c011DC980E695EdE1e314af0a82C7E2b01e3B`
- **Chain ID**: 42220 (Celo Mainnet)
- **Celoscan**: https://celoscan.io
- **Blockscout**: https://celo.blockscout.com