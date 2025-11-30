// BunnyGame ABI
export const bunnyGameABI = [
  {
    "type": "constructor",
    "inputs": [{ "name": "_eggTokenAddress", "type": "address", "internalType": "address" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ACTION_ACCUMULATION_TIME",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "EGG_REWARD",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "FREE_INSTANT_ACTIONS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "HAPPINESS_PER_ACTION",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_CLAIMABLE_ACTIONS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_HAPPINESS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "bunnies",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "happiness", "type": "uint256", "internalType": "uint256" },
      { "name": "claimableActions", "type": "uint256", "internalType": "uint256" },
      { "name": "lastActionUpdate", "type": "uint256", "internalType": "uint256" },
      { "name": "totalEggsLaid", "type": "uint256", "internalType": "uint256" },
      { "name": "instantActionsRemaining", "type": "uint256", "internalType": "uint256" },
      { "name": "initialized", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canLayEgg",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eggToken",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract EggToken" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feedBunny",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getBunny",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "happiness", "type": "uint256", "internalType": "uint256" },
      { "name": "claimableActions", "type": "uint256", "internalType": "uint256" },
      { "name": "lastActionUpdate", "type": "uint256", "internalType": "uint256" },
      { "name": "totalEggsLaid", "type": "uint256", "internalType": "uint256" },
      { "name": "instantActionsRemaining", "type": "uint256", "internalType": "uint256" },
      { "name": "initialized", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTimeUntilNextAction",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalActions",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isActionAvailable",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "layEgg",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "petBunny",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tapBunny",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ActionPerformed",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "actionType", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "newHappiness", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BunnyHappinessReset",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EggLaid",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "totalEggs", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  }
] as const;

// RetentionSystem ABI
export const retentionSystemABI = [
  {
    "type": "constructor",
    "inputs": [{ "name": "_eggTokenAddress", "type": "address", "internalType": "address" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "BASE_EGGS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_STREAK",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ONE_DAY",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "REFERRAL_BONUS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "STREAK_3_EGGS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "STREAK_7_EGGS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "STREAK_THRESHOLD_2",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "checkIn",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkInWithReferral",
    "inputs": [{ "name": "referrer", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "currentStreak",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eggToken",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract EggToken" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getNextReward",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserStats",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "lastCheck", "type": "uint256", "internalType": "uint256" },
      { "name": "streak", "type": "uint256", "internalType": "uint256" },
      { "name": "referrer", "type": "address", "internalType": "address" },
      { "name": "referrals", "type": "uint256", "internalType": "uint256" },
      { "name": "canCheckIn", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasBeenReferred",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastCheckIn",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "referralCount",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "referredBy",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "timeUntilNextCheckIn",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "willStreakBreak",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CheckedIn",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "streak", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "eggsEarned", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReferralCompleted",
    "inputs": [
      { "name": "referrer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "referred", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "bonusEggs", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StreakBroken",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "previousStreak", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyCheckedInToday",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyReferred",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CannotReferSelf",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReferrerNotActive",
    "inputs": []
  }
] as const;

// SeasonReward ABI
export const seasonRewardABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "batchGetClaimStatus",
    "inputs": [{ "name": "users", "type": "address[]", "internalType": "address[]" }],
    "outputs": [
      { "name": "rewardAmounts", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "claimedStatus", "type": "bool[]", "internalType": "bool[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimReward",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "distributionEnded",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "endDistribution",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getClaimStatus",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "rewardAmount", "type": "uint256", "internalType": "uint256" },
      { "name": "claimed", "type": "bool", "internalType": "bool" },
      { "name": "canClaim", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractBalance",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasClaimed",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isDistributionActive",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reopenDistribution",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rewards",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setSeasonRewards",
    "inputs": [
      { "name": "users", "type": "address[]", "internalType": "address[]" },
      { "name": "amounts", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardSet",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SeasonFunded",
    "inputs": [
      { "name": "total", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Withdrawn",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const;

// EggToken ABI (minimal for balance checking)
export const eggTokenABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" },
      { "name": "spender", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  }
] as const;

