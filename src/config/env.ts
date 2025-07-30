export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://rollback-service.onrender.com/api/v1",
  rollbackManagerAddress: "0x7aFA0a3063CC49898da29C8CF5275DB13146aB6A",
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID || "",
} as const;

export type Config = typeof config;
