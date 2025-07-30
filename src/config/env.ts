export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://rollback-service.onrender.com/api/v1",
  rollbackManagerAddress:"0xC874C97b43c6D0Db4A877b87F100Df88d9300dF4",
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
} as const;

export type Config = typeof config;
