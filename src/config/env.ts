export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  rollbackManagerAddress: import.meta.env.VITE_ROLLBACK_MANAGER_ADDRESS || "",
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "84532"),
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
} as const;

export type Config = typeof config;
