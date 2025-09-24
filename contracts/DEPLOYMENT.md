## 🚀 Deployment Commands (EDU Chain)

### EDU Chain - Chain ID: 41923

```bash
source .env && rm -rf cache out && forge build && forge script --chain 41923 script/QuizGame.s.sol:QuizGameScript --rpc-url https://rpc.edu-chain.raas.gelato.cloud --broadcast -vvvv --private-key ${PRIVATE_KEY} --gas-estimate-multiplier 200 --legacy
```

**Note**: EDU Chain requires legacy transactions and higher gas estimates due to network-specific gas behavior.

**✅ Successfully Deployed Contracts on EDU Chain:**
- **Token1 (XP Points)**: `0x57AED70DA2c288E4a79D2ca797ED9B276db47793`
- **QuizGame**: `0x5A65590851b40939830cB5Ced3dEe8A0051cEDb7`

## 🚀 Deployment Commands (Base Mainnet)

### Base Mainnet - Chain ID: 8453

```bash
source .env && rm -rf cache out && forge build && forge script --chain 8453 script/QuizGame.s.sol:QuizGameScript --rpc-url https://mainnet.base.org --broadcast -vvvv --private-key ${PRIVATE_KEY}
```

```bash
source .env && rm -rf cache out && forge build && forge script --chain 8453 script/QuizGame.s.sol:QuizGameScript --rpc-url https://mainnet.base.org --broadcast -vvvv --private-key ${PRIVATE_KEY} --slow --batch-size 1
```

## 🚀 Deployment Commands (Celo Mainnet)

### Celo Mainnet - Chain ID: 42220

```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/QuizGame.s.sol:QuizGameScript --rpc-url https://forno.celo.org --broadcast -vvvv --private-key ${PRIVATE_KEY}
```

```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/QuizGame.s.sol:QuizGameScript --rpc-url https://forno.celo.org --broadcast -vvvv --private-key ${PRIVATE_KEY} --slow --batch-size 1
```

## 🌐 EDU Chain Network Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | EDU Chain |
| **Chain ID** | 41923 |
| **RPC Endpoint** | https://rpc.edu-chain.raas.gelato.cloud |
| **Currency Symbol** | ETH |
| **Block Explorer URL** | https://educhain.blockscout.com |

## 🌐 Base Mainnet Network Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | Base |
| **Chain ID** | 8453 |
| **RPC Endpoint** | https://mainnet.base.org |
| **Alternative RPC** | https://base.llamarpc.com |
| **Currency Symbol** | ETH |
| **Block Explorer URL** | https://basescan.org |
| **Bridge** | https://bridge.base.org |

## 🌐 Celo Mainnet Network Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | Celo |
| **Chain ID** | 42220 |
| **RPC Endpoint** | https://forno.celo.org |
| **Alternative RPC** | https://rpc.ankr.com/celo |
| **Currency Symbol** | CELO |
| **Block Explorer URL** | https://explorer.celo.org |
| **Bridge** | https://bridge.celo.org |

## 📋 Contract Verification

After deployment, verify your contracts on Basescan:

```bash
# Verify QuizGame contract on Base
forge verify-contract \
--chain-id 8453 \
--rpc-url https://mainnet.base.org \
--etherscan-api-key $BASESCAN_API_KEY \
<CONTRACT_ADDRESS> \
src/QuizGame.sol:QuizGame

# Verify Token1 contract on Base
forge verify-contract \
--chain-id 8453 \
--rpc-url https://mainnet.base.org \
--etherscan-api-key $BASESCAN_API_KEY \
<TOKEN_CONTRACT_ADDRESS> \
src/QuizGame.sol:Token1
```

After deployment, verify your contracts on Celo Explorer:

```bash
# Verify QuizGame contract on Celo
forge verify-contract \
--chain-id 42220 \
--rpc-url https://forno.celo.org \
--etherscan-api-key $CELO_EXPLORER_API_KEY \
<CONTRACT_ADDRESS> \
src/QuizGame.sol:QuizGame

# Verify Token1 contract on Celo
forge verify-contract \
--chain-id 42220 \
--rpc-url https://forno.celo.org \
--etherscan-api-key $CELO_EXPLORER_API_KEY \
<TOKEN_CONTRACT_ADDRESS> \
src/QuizGame.sol:Token1
```

## 🔗 Useful Resources

### Base
- **Explorer**: https://basescan.org/
- **RPC**: https://mainnet.base.org
- **Bridge**: https://bridge.base.org/
- **Docs**: https://docs.base.org/
- **Status**: https://status.base.org/

### Celo
- **Explorer**: https://explorer.celo.org/
- **RPC**: https://forno.celo.org
- **Bridge**: https://bridge.celo.org/
- **Docs**: https://docs.celo.org/
- **Status**: https://status.celo.org/
