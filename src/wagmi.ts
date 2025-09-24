import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
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
    miniAppConnector()
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export { config };

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
