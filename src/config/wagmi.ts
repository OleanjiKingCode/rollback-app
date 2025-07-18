import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  rainbowWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  rabbyWallet,
  zerionWallet,
  ledgerWallet,
  safeWallet,
  phantomWallet,
  braveWallet,
  argentWallet,
  imTokenWallet,
  okxWallet,
  bitgetWallet,
  uniswapWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
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
import { createPublicClient, http as viemHttp } from "viem";

// Define all supported chains
const chains = [
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
] as const;

// Create wallet connectors with expanded wallet support
// Now includes 17+ popular wallets organized in groups
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet, // MetaMask
        rainbowWallet, // Rainbow Wallet
        coinbaseWallet, // Coinbase Wallet
        walletConnectWallet, // WalletConnect
      ],
    },
    {
      groupName: "More Wallets",
      wallets: [
        trustWallet, // Trust Wallet
        rabbyWallet, // Rabby Wallet
        zerionWallet, // Zerion
        braveWallet, // Brave Wallet
        argentWallet, // Argent
        safeWallet, // Safe (Gnosis Safe)
        ledgerWallet, // Ledger
        phantomWallet, // Phantom
        imTokenWallet, // imToken
        okxWallet, // OKX Wallet
        bitgetWallet, // Bitget Wallet
        uniswapWallet, // Uniswap Wallet
        injectedWallet, // Any injected wallet
      ],
    },
  ],
  {
    appName: "Rollback Crypto Shield",
    projectId: config.reownProjectId || "demo-project-id",
  }
);

// Create Wagmi config
export const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [polygonMumbai.id]: http(),
    [arbitrumSepolia.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: false,
});

// Enhanced public client for direct blockchain interactions
export const publicClient = createPublicClient({
  chain: baseSepolia,
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
