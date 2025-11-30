import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouterVite(),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ['pg'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Wallet and blockchain core
          'wagmi-core': ['wagmi', 'viem', '@wagmi/core'],

          // Coinbase OnchainKit
          'onchainkit': ['@coinbase/onchainkit'],

          // Farcaster SDK
          'farcaster': ['@farcaster/miniapp-sdk', '@farcaster/miniapp-wagmi-connector'],

          // Swap/Bridge SDKs
          'swap-libs': ['@lifi/sdk'],

          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // Router
          'router': ['@tanstack/react-router', '@tanstack/react-query'],

          // UI libraries
          'ui-vendor': [
            'framer-motion',
            'lucide-react',
            'sonner',
            '@radix-ui/react-dialog'
          ],

          // Crypto utilities
          'crypto-vendor': [
            'ethers',
            '@redstone-finance/evm-connector'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for vendor chunks
  },
});
