// Contract addresses by chain ID
const CONTRACT_ADDRESSES = {
  // Base (Mainnet)
  8453: {
    token1ContractAddress: "0xF3c3D545f3dD2A654dF2F54BcF98421CE2e3f121",
    quizGameContractAddress: "0x25D79A35F6323D0d3EE617549Cc507ED6B9639Cb",
    seasonRewardContractAddress: "0x47358AF939cdB5B2b79a1AEE7d9E02760b2b73b2",
    // New demo contracts (placeholder addresses - update after deployment)
    quizDuelContractAddress: "0x0000000000000000000000000000000000000001",
    guildSystemContractAddress: "0x0000000000000000000000000000000000000002",
    quizNFTContractAddress: "0x0000000000000000000000000000000000000003"
  },
  42220: {
    token1ContractAddress: "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7",
    quizGameContractAddress: "0x367c011DC980E695EdE1e314af0a82C7E2b01e3B"
  },
  // EDU Chain
  41923: {
    token1ContractAddress: "0x57AED70DA2c288E4a79D2ca797ED9B276db47793",
    quizGameContractAddress: "0x5A65590851b40939830cB5Ced3dEe8A0051cEDb7"
  }
} as const;

// Rewards configuration by chain ID
const REWARDS_CONFIG = {
  // Base (Mainnet)
  8453: {
    totalReward: 600000,
    currency: "YUZU",
    symbol: "🍊",
    maxWinners: 200,
    seasonEndDate: undefined // No deadline for Base
  },
  // Celo
  42220: {
    totalReward: 0,
    currency: "CELO",
    symbol: "🟡",
    maxWinners: 50,
    seasonEndDate: undefined // Celo season ends December 31, 2025
  },
  // EDU Chain
  41923: {
    totalReward: 10000,
    currency: "XP3",
    symbol: "🎓",
    maxWinners: 100,
    seasonEndDate: undefined // No deadline for EDU Chain
  }
} as const;

// Token1 ABI for balance checking
export const token1ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  }
] as const;

// Function to get contract addresses by chain ID
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || {
    token1ContractAddress: "0x0000000000000000000000000000000000000000",
    quizGameContractAddress: "0x0000000000000000000000000000000000000000",
    seasonRewardContractAddress: "0x0000000000000000000000000000000000000000"
  };
}

// Function to get rewards configuration by chain ID
export function getRewardsConfig(chainId: number) {
  return REWARDS_CONFIG[chainId as keyof typeof REWARDS_CONFIG] || {
    totalReward: 1000,
    currency: "UNKNOWN",
    symbol: "❓",
    maxWinners: 200,
    seasonEndDate: undefined
  };
}

// Legacy exports removed - use getContractAddresses(chainId) instead

// Demo configuration
export const DEMO_CONFIG = {
  AUTO_PLAY_INTERVAL: 30000, // 30 seconds per step
  STEP_DURATION: {
    1: 20000, // Solo Quiz: 20 seconds
    2: 29000, // PvP Duel: 29 seconds  
    3: 29000, // Guild System: 29 seconds
    4: 26000  // NFT Quizzes: 26 seconds
  },
  MOCK_DATA: {
    ORACLE_PRICES: {
      ETH: { price: 2450.50, index: 1 },
      BASE: { price: 1.23, index: 2 }
    },
    GUILD_MEMBERS: [
      { name: "Alex", score: 850, avatar: "👤", fid: 12345 },
      { name: "Sarah", score: 720, avatar: "👩", fid: 23456 },
      { name: "Mike", score: 680, avatar: "👨", fid: 34567 },
      { name: "Emma", score: 590, avatar: "👱‍♀️", fid: 45678 }
    ]
  }
} as const;