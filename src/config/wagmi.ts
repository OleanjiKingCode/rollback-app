import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  baseSepolia,
  base,
  mainnet,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumSepolia,
  bsc,
  bscTestnet,
  sepolia,
} from "wagmi/chains";
import { config } from "./env";
import { createPublicClient, http } from "viem";

export const wagmiConfig = getDefaultConfig({
  appName: "Rollback Crypto Shield",
  projectId: config.reownProjectId || "demo-project-id", 
  chains: [
    // Mainnets
    mainnet,
    base,
    polygon,
    arbitrum,
    bsc,
    // Testnets
    sepolia,
    baseSepolia,
    polygonMumbai,
    arbitrumSepolia,
    bscTestnet,
  ],
  ssr: false,
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

// Chain configuration for the chain selector
export const SUPPORTED_CHAINS = [
  // Mainnets
  {
    ...mainnet,
    logo: "/Eth.png",
    isTestnet: false,
  },
  {
    ...base,
    logo: "/base.png",
    isTestnet: false,
  },
  {
    ...polygon,
    logo: "/matic.png",
    isTestnet: false,
  },
  {
    ...arbitrum,
    logo: "/arbitrum.png",
    isTestnet: false,
  },
  {
    ...bsc,
    logo: "/binance.png",
    isTestnet: false,
  },
  // Testnets
  {
    ...sepolia,
    logo: "/Eth.png",
    isTestnet: true,
  },
  {
    ...baseSepolia,
    logo: "/base.png",
    isTestnet: true,
  },
  {
    ...polygonMumbai,
    logo: "/matic.png",
    isTestnet: true,
  },
  {
    ...arbitrumSepolia,
    logo: "/arbitrum.png",
    isTestnet: true,
  },
  {
    ...bscTestnet,
    logo: "/binance.png",
    isTestnet: true,
  },
];
