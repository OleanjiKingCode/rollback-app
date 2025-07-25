import useSWR from "swr";
import { config } from "@/config/env";
import type {
  User,
  UserData,
  Wallet,
  RollbackHistory,
  WalletActivity,
  SystemStats,
  AgentWallet,
} from "@/types/api";

const fetcher = async (url: string) => {
  const res = await fetch(`${config.apiUrl}${url}`);

  // Handle 404 specifically for user endpoints - means user doesn't exist yet
  if (res.status === 404 && url.includes("/users/")) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch data`);
  }
  return res.json();
};

const postData = async (url: string, data: any) => {
  const res = await fetch(`${config.apiUrl}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to post data");
  }
  return res.json();
};

const putData = async (url: string, data: any) => {
  const res = await fetch(`${config.apiUrl}${url}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update data");
  }
  return res.json();
};

// SWR Hooks for data fetching
export const useUser = (address: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<UserData>(
    address ? `/wallets/users/${address}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 0,
      errorRetryInterval: 0,
      focusThrottleInterval: 0,
    }
  );

  // Debug logging for API response
  console.log("📡 useUser API Debug:", {
    address,
    data,
    error,
    isLoading,
    url: address ? `/wallets/users/${address}` : null,
    fullApiUrl: address ? `${config.apiUrl}/wallets/users/${address}` : null,
  });

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useUserWallets = (userId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<Wallet[]>(
    userId ? `/wallets/users/${userId}/wallets` : null,
    fetcher,
    { dedupingInterval: 0, refreshInterval: 0 }
  );

  return {
    wallets: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};

export const useRollbackHistory = (userId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<RollbackHistory[]>(
    userId ? `/wallets/users/${userId}/rollback-history` : null,
    fetcher,
    { dedupingInterval: 0, refreshInterval: 0 }
  );

  return {
    history: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};

export const useWalletActivity = (address: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<WalletActivity>(
    address ? `/wallets/wallets/${address}/activity` : null,
    fetcher,
    { dedupingInterval: 0, refreshInterval: 0 }
  );

  return {
    activity: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useSystemStats = () => {
  const { data, error, isLoading, mutate } = useSWR<SystemStats>(
    "/wallets/stats",
    fetcher,
    { dedupingInterval: 0, refreshInterval: 0 }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
};

// API Functions for mutations
export const createUser = async (userData: {
  walletAddress: string;
  rollbackConfig?: any;
}) => {
  return postData("/wallets/users", userData);
};

export const updateRollbackConfig = async (userId: string, updates: any) => {
  return putData(`/wallets/users/${userId}/rollback-config`, updates);
};

export const addWallet = async (userId: string, walletAddress: string) => {
  return postData(`/wallets/users/${userId}/wallets`, { walletAddress });
};

export const markWalletObsolete = async (address: string) => {
  return putData(`/wallets/wallets/${address}/obsolete`, {});
};

export const resetWalletActivity = async (address: string) => {
  return postData(`/wallets/wallets/${address}/reset-activity`, {});
};

export const triggerMonitoring = async () => {
  return postData("/wallets/monitoring/trigger", {});
};

export const estimateRollback = async (data: {
  userId: string;
  fromWallet: string;
  toWallet: string;
}) => {
  return postData("/wallets/rollback/estimate", data);
};

export const validateRollback = async (data: {
  userId: string;
  fromWallet: string;
  toWallet: string;
}) => {
  return postData("/wallets/rollback/validate", data);
};

export const retryRollback = async (historyId: string) => {
  return postData(`/wallets/rollback/${historyId}/retry`, {});
};

// Agent wallet creation (this would be handled by backend)
export const createAgentWallet = async (): Promise<AgentWallet> => {
  return postData("/wallets/agent/create", {});
};
