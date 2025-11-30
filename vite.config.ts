import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
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
    exclude: ["pg"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "wagmi-core": ["wagmi", "viem", "@wagmi/core"],
          onchainkit: ["@coinbase/onchainkit"],
          farcaster: ["@farcaster/miniapp-sdk", "@farcaster/miniapp-wagmi-connector"],
          "swap-libs": ["@lifi/sdk"],
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          router: ["@tanstack/react-router", "@tanstack/react-query"],
          "ui-vendor": [
            "framer-motion",
            "lucide-react",
            "sonner",
            "@radix-ui/react-dialog",
          ],
          "crypto-vendor": ["ethers", "@redstone-finance/evm-connector"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
