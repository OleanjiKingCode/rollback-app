import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserData } from "@/types/api";

interface LoadingStates {
  userLoading: boolean;
  portfolioLoading: boolean;
  dashboardLoading: boolean;
  walletCreationLoading: boolean;
}

interface WalletCache {
  [address: string]: {
    data: UserData;
    userRole: "owner" | "recovery_wallet";
    isFromContract: boolean; // backward compatibility
    dataSource: "api" | "contract" | "both"; // new field
    lastFetched: number;
    expiresAt: number;
  };
}

// Persistent wallet info that should survive browser sessions
interface PersistentWalletInfo {
  address: string;
  rollbackWalletAddress: string;
  userRole: "owner" | "recovery_wallet";
  isFromContract: boolean; // backward compatibility
  dataSource: "api" | "contract" | "both"; // new field
  agentWallet: string;
  fallbackWallet: string;
  threshold: number;
  isActive: boolean;
  lastUpdated: number;
}

interface WalletRegistry {
  [userAddress: string]: PersistentWalletInfo;
}

interface AppState {
  // Loading states
  loadingStates: LoadingStates;

  // User data
  currentUser: UserData | null;
  isUserLoaded: boolean;

  // Global wallet cache (temporary - 5 minutes)
  walletCache: WalletCache;
  currentAddress: string | null;

  // Persistent wallet registry (survives browser sessions)
  walletRegistry: WalletRegistry;

  // Dashboard states
  lastRefreshTime: Date;
  hasInitiallyLoaded: boolean;

  // Actions
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  setCurrentUser: (user: UserData | null) => void;
  setUserLoaded: (loaded: boolean) => void;
  setLastRefreshTime: (time: Date) => void;
  setHasInitiallyLoaded: (loaded: boolean) => void;

  // Wallet cache actions (temporary) - updated to support both signatures
  setWalletData: (
    address: string,
    data: UserData,
    userRole: "owner" | "recovery_wallet",
    isFromContractOrDataSource: boolean | "api" | "contract" | "both"
  ) => void;
  getWalletData: (address: string) => {
    data: UserData;
    userRole: "owner" | "recovery_wallet";
    isFromContract: boolean;
    dataSource?: "api" | "contract" | "both"; // optional for backward compatibility
  } | null;
  invalidateWalletCache: (address?: string) => void;

  // Persistent wallet registry actions
  setPersistentWalletInfo: (
    userAddress: string,
    walletInfo: Omit<PersistentWalletInfo, "address" | "lastUpdated">
  ) => void;
  getPersistentWalletInfo: (userAddress: string) => PersistentWalletInfo | null;
  removePersistentWalletInfo: (userAddress: string) => void;
  clearWalletRegistry: () => void;

  setCurrentAddress: (address: string | null) => void;

  resetStates: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PERSISTENT_DATA_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

const initialLoadingStates: LoadingStates = {
  userLoading: false,
  portfolioLoading: false,
  dashboardLoading: false,
  walletCreationLoading: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        loadingStates: initialLoadingStates,
        currentUser: null,
        isUserLoaded: false,
        walletCache: {},
        walletRegistry: {},
        currentAddress: null,
        lastRefreshTime: new Date(),
        hasInitiallyLoaded: false,

        // Actions
        setLoading: (key, value) =>
          set(
            (state) => ({
              loadingStates: {
                ...state.loadingStates,
                [key]: value,
              },
            }),
            false,
            `setLoading:${key}:${value}`
          ),

        setCurrentUser: (user) =>
          set(
            { currentUser: user },
            false,
            `setCurrentUser:${user?.user?.id || "null"}`
          ),

        setUserLoaded: (loaded) =>
          set({ isUserLoaded: loaded }, false, `setUserLoaded:${loaded}`),

        setLastRefreshTime: (time) => {
          const validTime = time instanceof Date ? time : new Date();
          set({ lastRefreshTime: validTime }, false, "setLastRefreshTime");
        },

        setHasInitiallyLoaded: (loaded) =>
          set(
            { hasInitiallyLoaded: loaded },
            false,
            `setHasInitiallyLoaded:${loaded}`
          ),

        setCurrentAddress: (address) =>
          set(
            { currentAddress: address },
            false,
            `setCurrentAddress:${address}`
          ),

        setWalletData: (
          address,
          data,
          userRole,
          isFromContractOrDataSource
        ) => {
          const now = Date.now();
          const isFromContract =
            typeof isFromContractOrDataSource === "boolean"
              ? isFromContractOrDataSource
              : isFromContractOrDataSource !== "api";

          const dataSource =
            typeof isFromContractOrDataSource === "string"
              ? isFromContractOrDataSource
              : (isFromContractOrDataSource ? "contract" : "api");

          set(
            (state) => ({
              walletCache: {
                ...state.walletCache,
                [address.toLowerCase()]: {
                  data,
                  userRole,
                  isFromContract,
                  dataSource,
                  lastFetched: now,
                  expiresAt: now + CACHE_DURATION,
                },
              },
            }),
            false,
            `setWalletData:${address}`
          );

          // Also update persistent registry with critical info
          if (data.rollbackConfig) {
            get().setPersistentWalletInfo(address, {
              rollbackWalletAddress:
                data.rollbackConfig.rollback_wallet_address,
              userRole,
              isFromContract,
              dataSource,
              agentWallet: data.rollbackConfig.agent_wallet || "",
              fallbackWallet: data.rollbackConfig.fallback_wallet || "",
              threshold: data.rollbackConfig.inactivity_threshold || 30,
              isActive: data.rollbackConfig.is_active || true,
            });
          }
        },

        getWalletData: (address) => {
          const cached = get().walletCache[address.toLowerCase()];
          if (!cached) return null;

          // Check if cache is still valid
          if (Date.now() > cached.expiresAt) {
            // Cache expired, remove it
            set(
              (state) => {
                const newCache = { ...state.walletCache };
                delete newCache[address.toLowerCase()];
                return { walletCache: newCache };
              },
              false,
              `expireCache:${address}`
            );
            return null;
          }

          return {
            data: cached.data,
            userRole: cached.userRole,
            isFromContract: cached.isFromContract,
            dataSource: cached.dataSource,
          };
        },

        invalidateWalletCache: (address) => {
          if (address) {
            // Invalidate specific address
            set(
              (state) => {
                const newCache = { ...state.walletCache };
                delete newCache[address.toLowerCase()];
                return { walletCache: newCache };
              },
              false,
              `invalidateCache:${address}`
            );
          } else {
            // Invalidate all cache
            set({ walletCache: {} }, false, "invalidateAllCache");
          }
        },

        // Persistent wallet registry actions
        setPersistentWalletInfo: (userAddress, walletInfo) => {
          const now = Date.now();
          set(
            (state) => ({
              walletRegistry: {
                ...state.walletRegistry,
                [userAddress.toLowerCase()]: {
                  address: userAddress,
                  ...walletInfo,
                  lastUpdated: now,
                },
              },
            }),
            false,
            `setPersistentWalletInfo:${userAddress}`
          );
        },

        getPersistentWalletInfo: (userAddress) => {
          const info = get().walletRegistry[userAddress.toLowerCase()];
          if (!info) return null;

          // Check if persistent data is still valid (30 days)
          if (Date.now() - info.lastUpdated > PERSISTENT_DATA_EXPIRY) {
            // Data is too old, remove it
            get().removePersistentWalletInfo(userAddress);
            return null;
          }

          return info;
        },

        removePersistentWalletInfo: (userAddress) => {
          set(
            (state) => {
              const newRegistry = { ...state.walletRegistry };
              delete newRegistry[userAddress.toLowerCase()];
              return { walletRegistry: newRegistry };
            },
            false,
            `removePersistentWalletInfo:${userAddress}`
          );
        },

        clearWalletRegistry: () => {
          set({ walletRegistry: {} }, false, "clearWalletRegistry");
        },

        resetStates: () =>
          set(
            {
              loadingStates: initialLoadingStates,
              currentUser: null,
              isUserLoaded: false,
              walletCache: {},
              currentAddress: null,
              hasInitiallyLoaded: false,
              // Note: walletRegistry is persistent and not reset
            },
            false,
            "resetStates"
          ),
      }),
      {
        name: "rollback-app-store",
        // Only persist the wallet registry and critical state
        partialize: (state) => ({
          walletRegistry: state.walletRegistry,
          lastRefreshTime: state.lastRefreshTime.toISOString(),
        }),
        version: 1,
        // Handle date deserialization when loading from localStorage
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Ensure lastRefreshTime is a proper Date object
            if (typeof state.lastRefreshTime === "string") {
              state.lastRefreshTime = new Date(state.lastRefreshTime);
            } else if (
              !state.lastRefreshTime ||
              !(state.lastRefreshTime instanceof Date)
            ) {
              state.lastRefreshTime = new Date();
            }
          }
        },
      }
    ),
    {
      name: "rollback-app-store",
    }
  )
);
