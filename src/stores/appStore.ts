import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UserData } from "@/types/api";

interface LoadingStates {
  userLoading: boolean;
  portfolioLoading: boolean;
  dashboardLoading: boolean;
  walletCreationLoading: boolean;
}

interface AppState {
  // Loading states
  loadingStates: LoadingStates;

  // User data
  currentUser: UserData | null;
  isUserLoaded: boolean;

  // Dashboard states
  lastRefreshTime: Date;
  hasInitiallyLoaded: boolean;

  // Actions
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  setCurrentUser: (user: UserData | null) => void;
  setUserLoaded: (loaded: boolean) => void;
  setLastRefreshTime: (time: Date) => void;
  setHasInitiallyLoaded: (loaded: boolean) => void;
  resetStates: () => void;
}

const initialLoadingStates: LoadingStates = {
  userLoading: false,
  portfolioLoading: false,
  dashboardLoading: false,
  walletCreationLoading: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      loadingStates: initialLoadingStates,
      currentUser: null,
      isUserLoaded: false,
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

      setLastRefreshTime: (time) =>
        set({ lastRefreshTime: time }, false, "setLastRefreshTime"),

      setHasInitiallyLoaded: (loaded) =>
        set(
          { hasInitiallyLoaded: loaded },
          false,
          `setHasInitiallyLoaded:${loaded}`
        ),

      resetStates: () =>
        set(
          {
            loadingStates: initialLoadingStates,
            currentUser: null,
            isUserLoaded: false,
            hasInitiallyLoaded: false,
          },
          false,
          "resetStates"
        ),
    }),
    {
      name: "rollback-app-store",
    }
  )
);
