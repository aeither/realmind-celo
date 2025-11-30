import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { metaMask, walletConnect, injected } from 'wagmi/connectors';
import {
  mainnet,
  base,
  optimism,
  arbitrum,
  polygon,
  zora,
  gnosis,
  bsc,
  avalanche,
  celo
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { SUPPORTED_CHAINS } from './libs/supportedChains';

// Define Unichain (not in viem yet)
const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.unichain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Unichain Explorer',
      url: 'https://explorer.unichain.org',
    },
  },
});

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

// All chains for swap functionality (Farcaster-supported + EDU Chain)
const ALL_SWAP_CHAINS = [
  mainnet,
  base,
  optimism,
  arbitrum,
  polygon,
  zora,
  unichain,
  gnosis,
  bsc,
  avalanche,
  celo,
  eduChain,
] as const;

// RPC URLs by chain ID - using reliable public endpoints
const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  8453: 'https://mainnet.base.org',
  10: 'https://mainnet.optimism.io',
  42161: 'https://arb1.arbitrum.io/rpc',
  137: 'https://polygon-rpc.com',
  7777777: 'https://rpc.zora.energy',
  130: 'https://rpc.unichain.org',
  100: 'https://rpc.gnosischain.com',
  56: 'https://bsc-dataseed1.binance.org',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  42220: 'https://forno.celo.org',
  41923: 'https://rpc.edu-chain.raas.gelato.cloud',
};

// Create transport configuration for all chains
const transports = ALL_SWAP_CHAINS.reduce((acc, chain) => {
  const rpcUrl = RPC_URLS[chain.id];
  acc[chain.id] = http(rpcUrl);
  return acc;
}, {} as Record<number, any>);

// Merge supported chains with swap chains (remove duplicates)
const allChains = Array.from(
  new Map(
    [...SUPPORTED_CHAINS, ...ALL_SWAP_CHAINS].map(chain => [chain.id, chain])
  ).values()
);

const config = createConfig({
  chains: allChains as any,
  transports,
  connectors: [
    metaMask(),                    // MetaMask browser extension
    miniAppConnector(),            // Farcaster Mini App connector
    walletConnect({                // WalletConnect QR code
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
    }),
    injected(),                    // Generic browser wallets
  ],
  ssr: false,
  storage: createStorage({
    storage: cookieStorage,
  }),
  multiInjectedProviderDiscovery: true, // Auto-detect multiple injected wallets
});

export { config };

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
