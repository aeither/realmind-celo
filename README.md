# Realmind Celo

**Learn and Earn** - Interactive learning platform with onchain quiz games and rewards on Celo blockchain.

## Problem

Traditional learning platforms lack financial incentives and onchain verification. Users invest time without tangible rewards, and there's no transparent way to prove blockchain knowledge mastery.

## Solution

Realmind creates a gamified learn-to-earn ecosystem on Celo where users:
- **Play blockchain quizzes** with real CELO rewards
- **Earn up to 190%** ROI based on quiz performance
- **Compete globally** on seasonal leaderboards
- **Get verified rewards** through smart contracts on Celo network

### Key Features
- 🎮 **Onchain Quiz Games** - Pay-to-play with CELO rewards
- 🧠 **AI-Generated Quizzes** - Dynamic content on Web3, DeFi, and blockchain topics
- 🏆 **Leaderboards** - Seasonal rankings with CELO prizes
- 🟡 **Celo Native** - Built specifically for the Celo ecosystem

## Tech Stack

- **Frontend**: React 18, TypeScript, TanStack Router, Tailwind CSS 4
- **Blockchain**: Wagmi, Viem, OnchainKit
- **Identity**: Self Protocol (privacy-preserving verification)
- **Social**: Farcaster MiniApp SDK
- **Referral Tracking**: Divvi Referral SDK
- **Smart Contracts**: Multiple quiz game contracts with reward distribution
- **State**: TanStack Query, Socket.io

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Smart Contracts

### Celo Mainnet (Chain ID: 42220)
- **Token Contract**: `0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7`
- **Quiz Game Contract**: `0x367c011DC980E695EdE1e314af0a82C7E2b01e3B`

## How It Works

1. **Connect** wallet to Celo network
2. **Choose** quiz topic (Web3, DeFi, Celo ecosystem)
3. **Play** and answer questions
4. **Earn** CELO tokens based on score (up to 190% return for perfect scores)

## Rewards System

- Perfect score: 190% return in CELO
- Score-based multipliers
- Seasonal leaderboard bonuses
- Transparent smart contract distribution

## Divvi Referral Integration

This dapp is integrated with [Divvi's referral ecosystem](https://divvi.xyz) to enable decentralized referral tracking and attribution.

### How It Works

All quiz game transactions (starting quizzes and collecting XP) include Divvi referral metadata:

1. **On-Chain Attribution**: Referral data is embedded in transaction calldata using the `dataSuffix` parameter
2. **Automatic Tracking**: Transaction hashes are automatically submitted to Divvi's attribution API after successful transactions
3. **Consumer Address**: `0x8e7eBE53b6ad215E395f3f17d43C3b75062DfDa1`

### Benefits

- Transparent referral tracking on the Celo blockchain
- Accurate attribution of user activities
- Support for referral rewards and incentives
- No additional user interaction required

For more information about Divvi, visit [docs.divvi.xyz](https://docs.divvi.xyz/).

## Self Protocol Integration

This dapp integrates [Self Protocol](https://docs.self.xyz/) for privacy-preserving identity verification and verifiable credentials.

### Features

- **Age Verification**: Prove you're 18+ without revealing your exact age or identity
- **Quiz Achievements**: Earn verifiable credentials for quiz completion and high scores
- **Verified Leaderboard**: Compete with verified users while maintaining privacy
- **Zero-Knowledge Proofs**: All verification happens through ZK proofs - no personal data is stored

### How It Works

1. **Scan QR Code**: Users scan a QR code with the Self app
2. **Provide Proof**: Self app generates a zero-knowledge proof
3. **Backend Verification**: Server verifies the proof without accessing personal data
4. **Participate**: Verified users can access quizzes and earn credentials

For detailed setup instructions, see [SELF_PROTOCOL.md](./SELF_PROTOCOL.md).

### Benefits

- Enhanced trust and safety on the platform
- Privacy-preserving compliance with age requirements
- Verifiable achievements without centralized identity systems
- Sybil resistance for leaderboards and rewards

For more information about Self Protocol, visit [docs.self.xyz](https://docs.self.xyz/).
