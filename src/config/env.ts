export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://rollback-service.onrender.com/api/v1",

  // Chain-specific contract addresses
  contracts: {
    // Base Sepolia (default)
    84532: {
      rollbackManagerAddress: "0x7aFA0a3063CC49898da29C8CF5275DB13146aB6A",
    },
    // Avalanche Fuji Testnet
    43113: {
      rollbackManagerAddress: "0x6981eAC5786690895dBaba50526EF064a613811d",
    },
  },

  // Default chain ID (Base Sepolia)
  defaultChainId: 84532,

  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
  BASE_SEPOLIA_RPC_URL:
    "https://base-sepolia.g.alchemy.com/v2/Ptk_9ZtxLVYipoJlX6W2PCsP-2Reh2MV",
  BASE_MAIN_RPC_URL:
    "https://base-mainnet.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  MATIC_TEST_RPC_URL:
    "https://polygon-amoy.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  MATIC_MAIN_RPC_URL:
    "https://polygon-mainnet.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  ARB_RPC_URL:
    "https://arbitrum-mainnet.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  ARB_TEST_RPC_URL:
    "https://arbitrum-sepolia.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",

  ETH_RPC_URL: "https://mainnet.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  AVAX_RPC_URL:
    "https://avalanche-mainnet.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  AVAX_FUJI_RPC_URL:
    "https://avalanche-fuji.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
  ETH_TEST_RPC_URL: "https://sepolia.infura.io/v3/2OitLygWtuYTjyfYwkTzD9RAUuj",
} as const;

export type Config = typeof config;

// Helper function to get contract address for a specific chain
export const getContractAddress = (chainId: number): string => {
  const chainConfig =
    config.contracts[chainId as keyof typeof config.contracts];

  if (!chainConfig) {
    // Fallback to default chain
    return config.contracts[config.defaultChainId].rollbackManagerAddress;
  }

  return chainConfig.rollbackManagerAddress;
};

// Backward compatibility - returns address for default chain
export const rollbackManagerAddress =
  config.contracts[config.defaultChainId].rollbackManagerAddress;
