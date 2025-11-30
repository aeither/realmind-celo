// Contract addresses by chain ID
// Note: This app only supports Celo (42220) for game contracts
// Swap/bridge functionality may support other chains
const CONTRACT_ADDRESSES = {
  // Celo (Mainnet) - Primary and only supported chain for game contracts
  42220: {
    token1ContractAddress: "0xe05489dea86d85c32609410a1bF9C35a0f8fc2e7",
    quizGameContractAddress: "0x367c011DC980E695EdE1e314af0a82C7E2b01e3B",
    seasonRewardContractAddress: "0x0000000000000000000000000000000000000000",
    // BunnyGame contracts (update after deployment)
    eggTokenContractAddress: "0x0000000000000000000000000000000000000000",
    bunnyGameContractAddress: "0x0000000000000000000000000000000000000000",
    retentionSystemContractAddress: "0x0000000000000000000000000000000000000000"
  }
} as const;

// Rewards configuration by chain ID
// Note: Only Celo (42220) is supported
const REWARDS_CONFIG = {
  // Celo (Mainnet) - Only supported chain
  42220: {
    totalReward: 250,
    currency: "CELO",
    symbol: "🟡",
    maxWinners: 30,
    seasonEndDate: new Date("2025-12-05T23:59:59Z") // Celo season ends December 5, 2025
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
export function getContractAddresses(_chainId: number) {
  // Only Celo (42220) is supported - return Celo addresses for any chain
  // This ensures the app always uses Celo contracts
  return CONTRACT_ADDRESSES[42220];
}

// Function to get rewards configuration by chain ID
export function getRewardsConfig(_chainId: number) {
  // Only Celo (42220) is supported - return Celo config for any chain
  return REWARDS_CONFIG[42220];
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