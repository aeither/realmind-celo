import { base, celo } from "viem/chains";
import { defineChain } from 'viem';

// Define EDU Chain
const eduChain = defineChain({
  id: 41923,
  name: 'EDU Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.edu-chain.raas.gelato.cloud'],
    },
  },
  blockExplorers: {
    default: {
      name: 'EDU Chain Explorer',
      url: 'https://explorer.edu-chain.raas.gelato.cloud',
    },
  },
});

// Get the supported chain ID from environment variable
const SUPPORTED_CHAIN_ID = parseInt(import.meta.env.VITE_SUPPORTED_CHAIN_ID || '42220');

// Map chain ID to chain object
const getChainFromId = (chainId: number) => {
  switch (chainId) {
    case 42220:
      return celo;
    case 8453:
      return base;
    case 41923:
      return eduChain;
    default:
      return celo; // Default to Celo if invalid chain ID
  }
};

// Export only the supported chain for this deployment
export const SUPPORTED_CHAIN = getChainFromId(SUPPORTED_CHAIN_ID);
export const SUPPORTED_CHAINS = [SUPPORTED_CHAIN] as const;

// Export chain ID for easy checking
export const SUPPORTED_CHAIN_IDS = [SUPPORTED_CHAIN_ID];

// Currency configuration for different chains
export const CURRENCY_CONFIG = {
  42220: { // Celo (Mainnet)
    symbol: 'CELO',
    multiplier: 1,
    defaultAmounts: ['0.001', '0.01', '0.1']
  },
  8453: { // Base (Mainnet)
    symbol: 'ETH',
    multiplier: 1,
    defaultAmounts: ['0.001', '0.01', '0.1']
  },
  41923: { // EDU Chain
    symbol: 'ETH',
    multiplier: 1,
    defaultAmounts: ['0.001', '0.01', '0.1']
  },
  default: {
    symbol: 'ETH',
    multiplier: 1,
    defaultAmounts: ['0.001', '0.01', '0.1']
  }
} as const;