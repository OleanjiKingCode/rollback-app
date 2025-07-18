export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://rollback-service.onrender.com/api/v1",
  rollbackManagerAddress:"0xbA429E21610fDFc09737a438898Dd31b0412c110",
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
} as const;

export type Config = typeof config;
