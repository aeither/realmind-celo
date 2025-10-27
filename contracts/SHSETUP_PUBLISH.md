## Setup
chmod +x verify.sh

## Publish

### QuizGame
```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/QuizGame.s.sol:QuizGameScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```

### ChickenGame
```bash
source .env && rm -rf cache out && forge build && forge script --chain 42220 script/ChickenGame.s.sol:ChickenGameScript --rpc-url https://forno.celo.org --broadcast --verify -vvvv --private-key ${PRIVATE_KEY}
```
