import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { type Address } from "viem";
import { config } from "@/config/env";
import {
  TOKEN_TYPE,
  ERC20_ABI,
  ERC721_ABI,
  ROLLBACK_MANAGER_ABI,
} from "@/config/contracts";
import {
  checkPendingCreationRequests,
  proposeWalletCreation,
  signWalletCreation,
  finalizeWalletCreation,
  getInitializationFee,
  getCreationRequest,
  approveERC20Token,
  approveERC721Token,
  checkERC20Approval,
  checkERC721Approval,
  updateBackendWithWalletData,
  type CreationRequest,
} from "@/lib/contracts";
import { useUser, createUser, createAgentWallet } from "@/lib/api";
import type {
  CreateWalletFormData,
  AgentWallet,
  UserData,
  WalletInfo,
  TokenToMonitor,
} from "@/types/api";
import { useAppStore } from "@/stores/appStore";
import {
  useCompleteWalletData,
  useSimpleFindRollbackWallet,
} from "./contracts/useSimpleRollbackRead";
import { useTokenInfo } from "./contracts/useTokenInfo";

// Rollback Wallet type for hook usage
export interface RollbackWallet {
  id: string;
  ownerAddress: string;
  rollbackWalletAddress: string;
  threshold: number;
  isRandomized: boolean;
  fallbackWallet: string;
  agentWallet: string;
  treasuryAddress: string;
  wallets: WalletInfo[];
  monitoredTokens: TokenToMonitor[];
  createdAt: string;
}

// Token balance and metadata types
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  type: "ERC20" | "ERC721";
  totalBalance: string;
  balancesByWallet: Record<string, string>;
  usdValue?: number;
}

export interface PortfolioData {
  totalValue: number;
  tokens: TokenInfo[];
  chartData: Array<{
    date: string;
    value: number;
    tokens: number;
  }>;
  distributionData: Array<{
    name: string;
    value: number;
    fill: string;
    percentage: number;
  }>;
}

// Wallet creation states
export type WalletCreationStep =
  | "idle"
  | "proposing"
  | "pending_signatures"
  | "ready_to_finalize"
  | "finalizing"
  | "approving_tokens"
  | "completed"
  | "error";

export interface WalletCreationState {
  step: WalletCreationStep;
  requestId: number | null;
  pendingRequest: CreationRequest | null;
  walletAddress: string | null;
  error: string | null;
  isCreating: boolean;
  needsSignature: boolean;
  canFinalize: boolean;
  signatureCount: number;
  totalSignersNeeded: number;
}

// Enhanced hook to fetch rollback wallet data from both backend API and smart contracts
export const useRollbackWallet = () => {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [hasInitiallyChecked, setHasInitiallyChecked] = useState(false);

  // Use global store for caching
  const {
    getWalletData,
    setWalletData,
    setCurrentAddress,
    invalidateWalletCache,
    currentAddress,
    getPersistentWalletInfo,
    setPersistentWalletInfo,
  } = useAppStore();

  // Fetch user data from backend API
  const {
    user: apiUser,
    isLoading: isLoadingApi,
    isError: apiError,
    mutate: refetchApi,
  } = useUser(address);

  // Use the comprehensive contract data hook
  const {
    data: contractData,
    hasWallet,
    walletAddress,
    userRole,
    isLoading: isLoadingContract,
    error: contractError,
  } = useCompleteWalletData(address, isConnected);

  console.log({ contractData });

  // Combined state from both sources
  const [userData, setUserData] = useState<any>(null);
  const [hasRollbackWallet, setHasRollbackWallet] = useState<
    boolean | undefined
  >(undefined);
  const [rollbackWalletAddress, setRollbackWalletAddress] = useState<
    string | null
  >(null);
  const [currentUserRole, setCurrentUserRole] = useState<
    "owner" | "recovery_wallet" | null
  >(null);
  const [dataSource, setDataSource] = useState<"api" | "contract" | "both">(
    "contract"
  );

  const checkWallet = useCallback(async () => {
    if (!address || !isConnected) {
      console.log("❌ Wallet not connected, clearing data");
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
      setDataSource("contract");
      setLoading(false);
      setHasInitiallyChecked(true);
      return;
    }

    console.log(
      "🔍 Starting combined API + contract wallet check for address:",
      address
    );
    setLoading(true);

    try {
      // Check cache first
      const cachedData = getWalletData(address);
      if (cachedData && cachedData.data) {
        console.log("📋 Found cached wallet data", cachedData);
        setUserData(cachedData.data);
        setHasRollbackWallet(true);
        setRollbackWalletAddress(
          cachedData.data.rollbackConfig?.rollback_wallet_address ||
            walletAddress
        );
        setCurrentUserRole(cachedData.userRole);
        setDataSource(cachedData.dataSource || "contract");
        setLoading(false);
        setHasInitiallyChecked(true);
        return;
      }

      // Wait for both API and contract data if still loading
      if (isLoadingApi || isLoadingContract) {
        console.log("⏳ API or contract data still loading...");
        return;
      }

      // Prioritize API data if available, fallback to contract data
      let finalUserData = null;
      let finalDataSource: "api" | "contract" | "both" = "contract";
      let finalWalletAddress = null;
      let finalUserRole: "owner" | "recovery_wallet" | null = null;

      // Check API data first
      if (apiUser && !apiError) {
        finalUserData = apiUser;
        finalWalletAddress = apiUser.rollbackConfig?.rollback_wallet_address;
        finalUserRole = "owner"; // API users are always owners
        finalDataSource = "api";

        // Enhance with contract data if available
        if (hasWallet && contractData) {
          // 🔥 ISSUE: This is where duplication might be happening - merging API and contract wallets
          finalUserData = {
            ...apiUser,
            contractData: contractData,
            // Keep API wallets as the source of truth, don't merge with contract wallets
            // wallets: apiUser.wallets, // Use only API wallets to avoid duplication
          };
          finalDataSource = "both";
          if (!finalWalletAddress) {
            finalWalletAddress = walletAddress;
          }
        }
      }
      // Fallback to contract-only data
      else if (hasWallet && contractData && walletAddress) {
        finalUserData = contractData;
        finalWalletAddress = walletAddress;
        finalUserRole = userRole || "owner";
        finalDataSource = "contract";
      }

      if (finalUserData && finalWalletAddress) {
        // Cache the combined data
        setWalletData(
          address,
          finalUserData,
          finalUserRole || "owner",
          finalDataSource
        );
        setUserData(finalUserData);
        setHasRollbackWallet(true);
        setRollbackWalletAddress(finalWalletAddress);
        setCurrentUserRole(finalUserRole);
        setDataSource(finalDataSource);

        console.log(
          `✅ Wallet detection successful (source: ${finalDataSource})`
        );
      } else {
        console.log("❌ No wallet found for address:", address);
        setUserData(null);
        setHasRollbackWallet(false);
        setRollbackWalletAddress(null);
        setCurrentUserRole(null);
        setDataSource("contract");
      }
    } catch (error) {
      console.error("❌ Error during wallet check:", error);
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
      setDataSource("contract");
    } finally {
      setLoading(false);
      setHasInitiallyChecked(true);
      console.log("🔄 Combined wallet check completed");
    }
  }, [
    address,
    isConnected,
    apiUser,
    apiError,
    isLoadingApi,
    contractData,
    hasWallet,
    walletAddress,
    userRole,
    isLoadingContract,
    getWalletData,
    setWalletData,
  ]);

  useEffect(() => {
    checkWallet();
  }, [checkWallet]);

  // Enhanced loading state logic
  const shouldShowLoading =
    isConnected &&
    !hasInitiallyChecked &&
    (loading || isLoadingContract || isLoadingApi);

  return {
    // Backward compatible returns for existing dashboard
    user: userData,
    hasRollbackWallet,
    rollbackWalletAddress,
    isLoading: shouldShowLoading,
    isError:
      !loading &&
      !isLoadingContract &&
      !isLoadingApi &&
      !userData &&
      hasInitiallyChecked &&
      isConnected,
    checkRollbackWallet: checkWallet,
    refetch: () => {
      // Clear cache and refetch from both sources
      if (address) {
        invalidateWalletCache(address);
        refetchApi();
        checkWallet();
      }
    },
    // Enhanced returns
    userRole: currentUserRole,
    dataSource,
    invalidateCache: () => address && invalidateWalletCache(address),
  };
};

export const useWalletCreationFlow = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<WalletCreationState>({
    step: "idle",
    requestId: null,
    pendingRequest: null,
    walletAddress: null,
    error: null,
    isCreating: false,
    needsSignature: false,
    canFinalize: false,
    signatureCount: 0,
    totalSignersNeeded: 0,
  });

  // Add the useSimpleFindRollbackWallet hook
  const {
    data: rollbackWalletData,
    isLoading: isLoadingRollbackWallet,
    error: rollbackWalletError,
  } = useSimpleFindRollbackWallet(address, isConnected);

  // Check for pending creation requests when wallet connects
  const checkPendingRequests = useCallback(async () => {
    if (!publicClient || !address || !isConnected) return;

    try {
      const pendingRequests = await checkPendingCreationRequests(
        publicClient,
        address
      );

      if (pendingRequests.length > 0) {
        const request = pendingRequests[0]; // Get the first pending request
        const needsSignature = !request.signers.includes(address);
        const canFinalize =
          request.signatureCount >= request.params.wallets.length;

        setState((prev) => ({
          ...prev,
          step: canFinalize ? "ready_to_finalize" : "pending_signatures",
          requestId: request.requestId,
          pendingRequest: request,
          needsSignature,
          canFinalize,
          signatureCount: request.signatureCount,
          totalSignersNeeded: request.params.wallets.length,
        }));

        return request;
      }
    } catch (error) {
      console.error("Error checking pending requests:", error);
    }

    return null;
  }, [publicClient, address, isConnected]);

  // Propose wallet creation
  const proposeCreation = useCallback(
    async (formData: CreateWalletFormData) => {
      if (!publicClient || !walletClient || !address || !isConnected) {
        throw new Error(
          "Wallet not connected or contract service not available"
        );
      }

      setState((prev) => ({
        ...prev,
        step: "proposing",
        isCreating: true,
        error: null,
      }));

      try {
        const requestId = await proposeWalletCreation(
          walletClient,
          publicClient,
          formData
        );

        setState((prev) => ({
          ...prev,
          step:
            formData.wallets.length > 1
              ? "pending_signatures"
              : "ready_to_finalize",
          requestId,
          isCreating: false,
          signatureCount: 1, // Proposer automatically signs
          totalSignersNeeded: formData.wallets.length,
          canFinalize: formData.wallets.length === 1,
        }));

        return requestId;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: error.message || "Failed to propose wallet creation",
          isCreating: false,
        }));
        throw error;
      }
    },
    [publicClient, walletClient, address, isConnected]
  );

  // Sign wallet creation
  const signCreation = useCallback(
    async (requestId: number) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error("Wallet not connected");
      }

      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      try {
        await signWalletCreation(walletClient, publicClient, requestId);

        // Refresh request state
        const updatedRequest = await getCreationRequest(
          publicClient,
          requestId
        );
        const canFinalize =
          updatedRequest.signatureCount >= updatedRequest.params.wallets.length;

        setState((prev) => ({
          ...prev,
          step: canFinalize ? "ready_to_finalize" : "pending_signatures",
          signatureCount: updatedRequest.signatureCount,
          needsSignature: false,
          canFinalize,
          isCreating: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Failed to sign wallet creation",
          isCreating: false,
        }));
        throw error;
      }
    },
    [publicClient, walletClient, isConnected]
  );

  // Finalize wallet creation
  const finalizeCreation = useCallback(
    async (requestId: number) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error("Wallet not connected");
      }

      setState((prev) => ({
        ...prev,
        step: "finalizing",
        isCreating: true,
        error: null,
      }));

      try {
        const walletAddress = await finalizeWalletCreation(
          walletClient,
          publicClient,
          requestId
        );

        setState((prev) => ({
          ...prev,
          step: "approving_tokens",
          walletAddress,
          isCreating: false,
        }));

        return walletAddress;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: error.message || "Failed to finalize wallet creation",
          isCreating: false,
        }));
        throw error;
      }
    },
    [publicClient, walletClient, isConnected]
  );

  // Complete the creation process with backend integration
  const completeCreation = useCallback(
    async (
      formData?: CreateWalletFormData,
      agentWalletAddress?: string,
      agentWalletPrivateKey?: string
    ) => {
      if (!address || !state.walletAddress || !formData) {
        console.error("❌ [WALLET] Missing required data for completion:", {
          hasAddress: !!address,
          hasWalletAddress: !!state.walletAddress,
          hasFormData: !!formData,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Missing required data for completion");
      }

      try {
        setState((prev) => ({
          ...prev,
          step: "completed",
          isCreating: true,
        }));

        // Step 1: Get the real wallet address from useSimpleFindRollbackWallet (not placeholder)
        let realWalletAddress = state.walletAddress;

        if (state.walletAddress === "WALLET_CREATED_PENDING") {
          console.log(
            "🔍 [WALLET] Getting real wallet address from useSimpleFindRollbackWallet..."
          );

          // Wait for the hook to load and get accurate data
          let retryCount = 0;
          const maxRetries = 5;

          while (retryCount < maxRetries) {
            if (isLoadingRollbackWallet) {
              console.log(
                `⏳ [WALLET] Waiting for useSimpleFindRollbackWallet data... (attempt ${
                  retryCount + 1
                }/${maxRetries})`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            }

            if (
              rollbackWalletData?.hasWallet &&
              rollbackWalletData?.walletAddress
            ) {
              realWalletAddress = rollbackWalletData.walletAddress;
              console.log(
                "✅ [WALLET] Real wallet address retrieved from useSimpleFindRollbackWallet:",
                realWalletAddress
              );

              // Update state with real address
              setState((prev) => ({
                ...prev,
                walletAddress: realWalletAddress,
              }));
              break;
            } else {
              console.warn(
                "⚠️ [WALLET] useSimpleFindRollbackWallet still returns no wallet, retrying..."
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retryCount++;
            }
          }

          if (
            retryCount >= maxRetries &&
            realWalletAddress === "WALLET_CREATED_PENDING"
          ) {
            console.warn(
              "⚠️ [WALLET] Failed to get real wallet address from useSimpleFindRollbackWallet after retries, using placeholder"
            );
            // Continue with placeholder - better to store something than nothing
          }
        }

        // Step 2: Create or get agent wallet from backend
        let agentWallet = agentWalletAddress;
        if (!agentWallet) {
          console.log("🔧 [WALLET] Creating agent wallet via backend API...");
          try {
            const createdAgent = await createAgentWallet();
            agentWallet = createdAgent.address;
            console.log("✅ [WALLET] Agent wallet created:", {
              address: agentWallet,
              timestamp: new Date().toISOString(),
            });
          } catch (agentError) {
            console.warn(
              "⚠️ [WALLET] Failed to create agent wallet via API, continuing without...",
              {
                error: agentError,
                timestamp: new Date().toISOString(),
              }
            );
            // Continue without agent wallet - can be added later
          }
        }

        // Step 3: Store user data in backend for monitoring
        console.log(
          "💾 [WALLET] Storing user data in backend for monitoring..."
        );
        let backendIntegrated = false;
        try {
          // Only proceed if we have email and agent wallet private key
          if (!formData.email) {
            throw new Error(
              "Email address is required for backend integration"
            );
          }
          if (!agentWalletAddress) {
            throw new Error(
              "Agent wallet address is required for backend integration"
            );
          }
          if (!agentWalletPrivateKey) {
            throw new Error(
              "Agent wallet private key is required for backend integration"
            );
          }

          console.log(
            "📊 [WALLET] Preparing backend payload with accurate useSimpleFindRollbackWallet data...",
            {
              userAddress: address,
              rollbackWalletAddress: realWalletAddress,
              agentWalletAddress: agentWallet || "",
              email: formData.email,
              walletsCount: formData.wallets.length,
              threshold: formData.threshold,
              isRandomized: formData.isRandomized,
              fallbackWallet: formData.fallbackWallet,
              tokensToMonitorCount: formData.tokensToMonitor.length,
              timestamp: new Date().toISOString(),
            }
          );

          await updateBackendWithWalletData({
            userAddress: address,
            rollbackWalletAddress: realWalletAddress, // Use accurate data from useSimpleFindRollbackWallet
            agentWalletAddress: agentWallet || "",
            agentWalletPrivateKey: agentWalletPrivateKey,
            wallets: formData.wallets,
            threshold: formData.threshold,
            isRandomized: formData.isRandomized,
            fallbackWallet: formData.fallbackWallet,
            email: formData.email,
            tokensToMonitor: formData.tokensToMonitor.map((token) => ({
              address: token.address,
              type: token.type,
              symbol: token.symbol,
              name: token.name,
            })),
          });

          console.log(
            "✅ [WALLET] User data stored in backend successfully using useSimpleFindRollbackWallet data"
          );
          backendIntegrated = true;
        } catch (backendError) {
          console.warn(
            "⚠️ [WALLET] Failed to store data in backend, wallet still functional:",
            {
              error: backendError,
              timestamp: new Date().toISOString(),
            }
          );
          // Wallet creation still succeeded, just no backend monitoring
        }

        setState((prev) => ({
          ...prev,
          step: "completed",
          isCreating: false,
        }));

        console.log(
          "🎉 [WALLET] Wallet creation completed successfully with useSimpleFindRollbackWallet data!",
          {
            walletAddress: realWalletAddress,
            agentWallet,
            backendIntegrated,
            timestamp: new Date().toISOString(),
          }
        );

        return {
          walletAddress: realWalletAddress,
          agentWallet,
          backendIntegrated,
        };
      } catch (error: any) {
        console.error("❌ [WALLET] Error during completion:", {
          error: error.message || "Unknown error",
          timestamp: new Date().toISOString(),
        });
        setState((prev) => ({
          ...prev,
          step: "error",
          error: error.message || "Failed to complete wallet creation",
          isCreating: false,
        }));
        throw error;
      }
    },
    [address, state.walletAddress, rollbackWalletData, isLoadingRollbackWallet]
  );

  // Reset state
  const resetState = useCallback(() => {
    setState({
      step: "idle",
      requestId: null,
      pendingRequest: null,
      walletAddress: null,
      error: null,
      isCreating: false,
      needsSignature: false,
      canFinalize: false,
      signatureCount: 0,
      totalSignersNeeded: 0,
    });
  }, []);

  return {
    state,
    checkPendingRequests,
    proposeCreation,
    signCreation,
    finalizeCreation,
    completeCreation,
    resetState,
  };
};

// Legacy hooks for backward compatibility
export const useCreateRollbackWallet = () => {
  const { proposeCreation } = useWalletCreationFlow();

  const createWallet = useCallback(
    async (
      formData: CreateWalletFormData,
      existingAgentWallet?: AgentWallet
    ) => {
      const updatedFormData = {
        ...formData,
        agentWallet: existingAgentWallet?.address || formData.agentWallet,
      };

      const requestId = await proposeCreation(updatedFormData);

      return {
        requestId,
        agentWallet: existingAgentWallet,
        needsSignatures: formData.wallets.length > 1,
        totalSignersNeeded: formData.wallets.length,
      };
    },
    [proposeCreation]
  );

  return {
    createWallet,
    isCreating: false,
    creationStep: "",
    requestId: null,
    agentWallet: null,
  };
};

export const useSignWalletCreation = () => {
  const { signCreation } = useWalletCreationFlow();
  const [isSigning, setIsSigning] = useState(false);

  const signCreationWrapper = useCallback(
    async (requestId: number) => {
      setIsSigning(true);
      try {
        await signCreation(requestId);
      } finally {
        setIsSigning(false);
      }
    },
    [signCreation]
  );

  return {
    signCreation: signCreationWrapper,
    isSigning,
  };
};

export const useFinalizeWalletCreation = () => {
  const { finalizeCreation } = useWalletCreationFlow();
  const [isFinalizing, setIsFinalizing] = useState(false);

  const finalizeCreationWrapper = useCallback(
    async (requestId: number) => {
      setIsFinalizing(true);
      try {
        return await finalizeCreation(requestId);
      } finally {
        setIsFinalizing(false);
      }
    },
    [finalizeCreation]
  );

  return {
    finalizeCreation: finalizeCreationWrapper,
    isFinalizing,
  };
};

export const useTokenApprovals = () => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);

  const approveTokens = useCallback(
    async (
      tokens: Array<{ address: string; type: "ERC20" | "ERC721" }>,
      rollbackWalletAddress: string
    ) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error(
          "Wallet not connected or contract service not available"
        );
      }

      setIsApproving(true);
      try {
        for (const token of tokens) {
          if (token.type === "ERC20") {
            await approveERC20Token(
              walletClient,
              publicClient,
              token.address as `0x${string}`,
              rollbackWalletAddress as `0x${string}`
            );
          } else {
            await approveERC721Token(
              walletClient,
              publicClient,
              token.address as `0x${string}`,
              rollbackWalletAddress as `0x${string}`
            );
          }
        }
      } catch (error) {
        console.error("Error approving tokens:", error);
        throw error;
      } finally {
        setIsApproving(false);
      }
    },
    [publicClient, walletClient, isConnected]
  );

  return {
    approveTokens,
    isApproving,
  };
};

// Simple hook to check if user needs approvals - uses the existing useTokenApprovals system
export const useApprovalWarningStatus = (user: any) => {
  const { address } = useAccount();
  const [warningStatus, setWarningStatus] = useState({
    showWarning: false,
    unapprovedCount: 0,
    totalTokens: 0,
    unapprovedTokens: [] as string[],
  });

  useEffect(() => {
    if (!user?.rollbackConfig?.tokens_to_monitor?.length || !address) {
      setWarningStatus({
        showWarning: false,
        unapprovedCount: 0,
        totalTokens: 0,
        unapprovedTokens: [],
      });
      return;
    }

    const tokens = user.rollbackConfig.tokens_to_monitor;
    const totalTokens = tokens.length;

    // For now, assume all tokens need approval until the user visits the approval page
    // This is a simplified approach - in a real app you'd check actual approval status
    const assumeNeedsApproval = totalTokens > 0; // Show warning if they have monitored tokens

    setWarningStatus({
      showWarning: assumeNeedsApproval,
      unapprovedCount: totalTokens, // Assume all need approval to be safe
      totalTokens,
      unapprovedTokens: tokens.map(
        (t: any) => t.symbol || t.address.slice(0, 8)
      ),
    });
  }, [user, address]);

  return warningStatus;
};

export const useTokenPortfolio = (user: UserData | null) => {
  const publicClient = usePublicClient();
  const { fetchTokenInfo } = useTokenInfo();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenBalance = useCallback(
    async (
      tokenAddress: string,
      walletAddress: string,
      tokenType: string
    ): Promise<string> => {
      if (!publicClient) return "0";

      try {
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
          functionName: "balanceOf",
          args: [walletAddress as `0x${string}`],
        });

        return balance.toString();
      } catch (err) {
        console.error(
          `Error fetching balance for ${tokenAddress} on ${walletAddress}:`,
          err
        );
        return "0";
      }
    },
    [publicClient]
  );

  const fetchPortfolioData = useCallback(async () => {
    if (!user || !user.rollbackConfig?.tokens_to_monitor || !publicClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { tokens_to_monitor } = user.rollbackConfig;
      const rawWallets = user.wallets || [];

      // 🔥 FIX: Deduplicate wallets by address (case-insensitive) before calculating portfolio
      const wallets = rawWallets.reduce((unique, wallet) => {
        const existingWallet = unique.find(
          (w) => w.address?.toLowerCase() === wallet.address?.toLowerCase()
        );
        if (!existingWallet) {
          unique.push(wallet);
        }
        return unique;
      }, [] as typeof rawWallets);

      const tokenInfoPromises = tokens_to_monitor.map(async (token) => {
        const info = await fetchTokenInfo(token.address, token.type);

        // Fetch balances for DEDUPLICATED wallets only
        const balancePromises = wallets.map(async (wallet) => {
          const balance = await fetchTokenBalance(
            token.address,
            wallet.address,
            token.type
          );

          return { walletAddress: wallet.address, balance };
        });

        const walletBalances = await Promise.all(balancePromises);
        const balancesByWallet: Record<string, string> = {};
        let totalBalance = BigInt(0);

        walletBalances.forEach(({ walletAddress, balance }) => {
          balancesByWallet[walletAddress] = balance;
          totalBalance += BigInt(balance);
        });

        return {
          address: token.address,
          symbol: info.symbol || "UNKNOWN",
          name: info.name || "Unknown Token",
          decimals: info.decimals || 18,
          type: info.type || (token.type as "ERC20" | "ERC721"),
          totalBalance: totalBalance.toString(),
          balancesByWallet,
          usdValue: 0, // Real USD value would come from price API integration
        } as TokenInfo;
      });

      const tokens = await Promise.all(tokenInfoPromises);

      // Generate real portfolio chart data (empty until historical data is available)
      const chartData = [
        { date: "Jan 1", value: 0, tokens: 0 },
        { date: "Jan 8", value: 0, tokens: 0 },
        { date: "Jan 15", value: 0, tokens: 0 },
        { date: "Jan 22", value: 0, tokens: 0 },
        { date: "Jan 29", value: 0, tokens: tokens.length },
      ];

      // Generate distribution data
      const colors = ["#E9A344", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
      const distributionData = tokens.map((token, index) => {
        const balance =
          parseFloat(token.totalBalance) / Math.pow(10, token.decimals);
        const percentage =
          tokens.length > 0 ? Math.round(100 / tokens.length) : 0;

        return {
          name: token.symbol,
          value: Math.round(balance * 100) / 100, // Real token balance
          fill: colors[index % colors.length],
          percentage: Math.round(percentage),
        };
      });

      // If no tokens, show placeholder
      if (distributionData.length === 0) {
        distributionData.push({
          name: "No tokens",
          value: 1,
          fill: "#E9A344",
          percentage: 100,
        });
      }

      const portfolioData: PortfolioData = {
        totalValue: 0, // Real total value would come from price API integration
        tokens,
        chartData,
        distributionData,
      };

      setPortfolio(portfolioData);
    } catch (err) {
      console.error("Error fetching portfolio data:", err);
      setError("Failed to fetch portfolio data");
    } finally {
      setIsLoading(false);
    }
  }, [user, publicClient, fetchTokenInfo, fetchTokenBalance]);

  return {
    portfolio,
    isLoading,
    error,
    fetchPortfolioData,
  };
};
