import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base, mainnet } from "wagmi/chains";
import { config } from "./env";

export const wagmiConfig = getDefaultConfig({
  appName: "Rollback Crypto Shield",
  projectId: config.reownProjectId || "demo-project-id", // WalletConnect Project ID
  chains: [baseSepolia, base, mainnet],
  ssr: false, // If your dApp uses server side rendering (SSR)
});
