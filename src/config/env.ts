export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  rollbackManagerAddress:
    import.meta.env.VITE_ROLLBACK_MANAGER_ADDRESS ||
    "0xbA429E21610fDFc09737a438898Dd31b0412c110",
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "84532"),
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
  // Contract constants
  initializationFee: "2640000000000000", // 0.00264 ETH in wei
  emergencyFee: "5280000000000000", // 0.00528 ETH in wei
} as const;

export type Config = typeof config;
