## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy with CREATE2 (Predictable Addresses)

The deployment script uses CREATE2 to deploy contracts to the same deterministic address across all blockchains.

#### Deploy to Base Mainnet

```shell
# Base Mainnet
source .env && rm -rf cache out && forge build && forge script --chain 8453 script/QuizGame.s.sol:QuizGameScript --rpc-url https://mainnet.base.org --broadcast -vvvv --private-key ${PRIVATE_KEY}
```

#### Predict Addresses (Without Deploying)

You can predict the contract addresses before deployment:

```shell
# Predict addresses for Base Mainnet
forge script script/QuizGame.s.sol:QuizGameScript --sig "predictAddresses()" --rpc-url https://mainnet.base.org
```

### Verify

```shell
# Base Mainnet
forge verify-contract \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key $BASESCAN_API_KEY \
  <CONTRACT_ADDRESS> \
  src/QuizGame.sol:QuizGame
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
