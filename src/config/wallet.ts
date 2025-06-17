import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import {
  mainnet,
  arbitrum,
  polygon,
  base,
  optimism,
  sepolia,
} from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId = "0e6a63582f5bca4e20f1974db23be899";

// Create a metadata object
const metadata = {
  name: "Rollback Wallet",
  description:
    "Never lose your crypto again - Advanced rollback protection for your assets",
  url: "https://rollback-wallet.com",
  icons: ["/lovable-uploads/86a7596b-4477-45a7-88bb-9de6bbadd014.png"],
};

// Create Ethers Adapter
const ethersAdapter = new EthersAdapter();

// Create the AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, arbitrum, polygon, base, optimism, sepolia],
  metadata,
  projectId,
  features: {
    analytics: true,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-color-mix": "#E9A344",
    "--w3m-color-mix-strength": 20,
    "--w3m-accent": "#E9A344",
    "--w3m-border-radius-master": "8px",
    "--w3m-font-family": "system-ui, sans-serif",
  },
});
