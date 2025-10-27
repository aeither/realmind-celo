# 🐔 Chicken Game - Gamified Token Minting

A gamified section of the quiz app where users care for a virtual chicken to earn EGG tokens.

## Features

### Smart Contracts

#### ChickenGame Contract
- **Three Free Actions**: Feed 🍗, Pet ❤️, Play 🎾
- **Happiness System**: Each action increases happiness by 10 points (max 100)
- **Instant Actions**: New users get 10 free instant actions to get started!
- **Cooldown System**: 24-hour cooldown between actions (after instant actions are used)
- **Egg Laying**: When happiness reaches 100, users can lay an egg to mint 1 EGG token
- **Reset Mechanism**: Happiness resets to 0 after laying an egg

#### EggToken Contract (ERC20)
- **Access Control**: Uses OpenZeppelin's AccessControl for minting permissions
- **Flexible Minting**: Admin can grant MINTER_ROLE to any address or contract
- **ChickenGame Integration**: ChickenGame contract has MINTER_ROLE to mint eggs

## Contract Architecture

```
EggToken (ERC20 + AccessControl)
    ↓ (minting permission)
ChickenGame (Game Logic)
    ↓ (user interactions)
Frontend (/chicken route)
```

## Files Created

### Smart Contracts
- `contracts/src/ChickenGame.sol` - Main game and token contracts
- `contracts/test/ChickenGame.t.sol` - Comprehensive test suite (29 tests, all passing ✅)
- `contracts/script/ChickenGame.s.sol` - Deployment script

### Frontend
- `src/routes/chicken.tsx` - Chicken game UI
- `src/libs/chickenGameABI.ts` - Contract ABI for frontend

## Deployment Instructions

### 1. Deploy Contracts

```bash
cd contracts

# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy to desired network
forge script script/ChickenGame.s.sol:ChickenGameScript --rpc-url <RPC_URL> --broadcast --verify
```

The deployment script will:
1. Deploy EggToken
2. Deploy ChickenGame with EggToken address
3. Grant MINTER_ROLE to ChickenGame contract
4. Display deployment summary

### 2. Update Frontend

After deployment, update the contract addresses in `src/routes/chicken.tsx`:

```typescript
const CHICKEN_GAME_ADDRESS = '0xYourChickenGameAddress' as `0x${string}`;
const EGG_TOKEN_ADDRESS = '0xYourEggTokenAddress' as `0x${string}`;
```

### 3. Test the Game

```bash
# Run tests
cd contracts
forge test --match-contract ChickenGameTest -vv
```

All 29 tests should pass ✅

## Game Mechanics

### For Users

1. **Get Started**: New users automatically get 10 instant actions
2. **Build Happiness**: Perform actions (Feed, Pet, Play) to increase happiness
3. **Lay Eggs**: Once happiness reaches 100, lay an egg to mint 1 EGG token
4. **Repeat**: Happiness resets to 0 after laying an egg, repeat the process

### Instant Actions Feature

- **Purpose**: Allows new users to experience the full game loop immediately
- **Count**: 10 free instant actions (enough to lay 1 egg)
- **Benefits**: 
  - No waiting for cooldowns initially
  - Users can immediately understand the game mechanics
  - Encourages user engagement and retention
- **After Exhaustion**: Normal 24-hour cooldown rules apply

### Cooldown System

- Each action type (Feed, Pet, Play) has its own 24-hour cooldown
- Users can perform one of each action type per day
- Instant actions bypass cooldowns completely

## Testing Results

✅ **29/29 tests passing**

Test Categories:
- Initialization (2 tests)
- Instant Actions (5 tests)
- Core Actions (4 tests)
- Egg Laying (5 tests)
- View Functions (5 tests)
- Multiple Players (2 tests)
- EggToken (4 tests)
- Edge Cases (2 tests)

## Security Features

- ✅ ReentrancyGuard on all state-changing functions
- ✅ AccessControl for minting permissions
- ✅ OpenZeppelin contracts for security
- ✅ Comprehensive test coverage

## Future Enhancements

Potential features to add:
- Different chicken types with unique stats
- Rare golden eggs
- Chicken marketplace
- Breeding mechanics
- Seasonal events
- Leaderboards for top egg producers

## Admin Functions

As admin (deployer), you can:

```solidity
// Grant minter role to another address
eggToken.grantRole(MINTER_ROLE, newMinterAddress);

// Revoke minter role
eggToken.revokeRole(MINTER_ROLE, oldMinterAddress);
```

## Contract Constants

- `ACTION_COOLDOWN`: 24 hours (86400 seconds)
- `HAPPINESS_PER_ACTION`: 10 points
- `MAX_HAPPINESS`: 100 points
- `EGG_REWARD`: 1 EGG token (1e18 wei)
- `FREE_INSTANT_ACTIONS`: 10 actions

## Technical Stack

- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Foundry
- **Frontend**: React + TanStack Router
- **Web3**: Wagmi + Viem
- **Libraries**: OpenZeppelin Contracts

## Support

For issues or questions:
1. Check test logs: `forge test --match-contract ChickenGameTest -vv`
2. Review contract events on block explorer
3. Verify frontend console for error messages

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2024

