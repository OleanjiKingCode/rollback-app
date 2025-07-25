export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://rollback-service.onrender.com/api/v1",
  rollbackManagerAddress:"0xc36fCaFDbd8773168654906ac8ac737a5DcfabBB",
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
} as const;

export type Config = typeof config;
