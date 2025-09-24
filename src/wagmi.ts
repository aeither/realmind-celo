import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { SUPPORTED_CHAINS } from './libs/supportedChains';

const config = getDefaultConfig({
  appName: 'Realmind',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  // Ensure proper chain persistence
  multiInjectedProviderDiscovery: true,
});

export { config };

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
