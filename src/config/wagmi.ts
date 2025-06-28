import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base, mainnet } from "wagmi/chains";
import { config } from "./env";
import { createPublicClient, http } from "viem";

export const wagmiConfig = getDefaultConfig({
  appName: "Rollback Crypto Shield",
  projectId: config.reownProjectId || "demo-project-id", // WalletConnect Project ID
  chains: [baseSepolia, base, mainnet],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

// Enhanced public client for direct blockchain interactions
export const publicClient = createPublicClient({
  chain: baseSepolia, // Default to testnet
  transport: http(),
  batch: {
    multicall: true,
  },
});

// Export chain info for hooks
export const CURRENT_CHAIN = baseSepolia;
export const CURRENT_CHAIN_ID = baseSepolia.id;
