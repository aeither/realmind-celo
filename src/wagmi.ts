import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { metaMask, walletConnect, injected } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from './libs/supportedChains';

// Create transport configuration for all supported chains
const transports = SUPPORTED_CHAINS.reduce((acc, chain) => {
  acc[chain.id] = http();
  return acc;
}, {} as Record<number, any>);

const config = createConfig({
  chains: SUPPORTED_CHAINS,
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
