import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useReadContract,
} from "wagmi";
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
import { createAgentWallet } from "@/lib/api";
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
  useGetAllWallets,
  useGetMonitoredTokens,
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

// Simplified hook to fetch rollback wallet data from smart contracts only
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

  // Only use contract data - no API calls
  const {
    data: contractData,
    hasWallet,
    walletAddress,
    userRole,
    isLoading: isLoadingContract,
    error: contractError,
  } = useCompleteWalletData(address, isConnected);

  // Simplified state - only from contracts
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

  const checkWallet = useCallback(async () => {
    if (!address || !isConnected) {
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
      setLoading(false);
      setHasInitiallyChecked(true);
      return;
    }

    setLoading(true);

    try {
      // Wait for contract data if still loading
      if (isLoadingContract) {
        return;
      }

      // Only use contract data
      if (hasWallet && contractData && walletAddress) {
        const finalUserData = contractData;
        const finalWalletAddress = walletAddress;
        const finalUserRole = userRole || "owner";

        // Cache the contract data
        setWalletData(
          address,
          finalUserData,
          finalUserRole,
          "contract" // Always contract source
        );

        setUserData(finalUserData);
        setHasRollbackWallet(true);
        setRollbackWalletAddress(finalWalletAddress);
        setCurrentUserRole(finalUserRole);
      } else {
        setUserData(null);
        setHasRollbackWallet(false);
        setRollbackWalletAddress(null);
        setCurrentUserRole(null);
      }
    } catch (error) {
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
    } finally {
      setLoading(false);
      setHasInitiallyChecked(true);
    }
  }, [
    address,
    isConnected,
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

  // Simplified loading state logic - only contract loading
  const shouldShowLoading =
    isConnected && !hasInitiallyChecked && (loading || isLoadingContract);

  return {
    // Returns for existing dashboard
    user: userData,
    hasRollbackWallet,
    rollbackWalletAddress,
    isLoading: shouldShowLoading,
    isError:
      !loading &&
      !isLoadingContract &&
      !userData &&
      hasInitiallyChecked &&
      isConnected,
    checkRollbackWallet: checkWallet,
    refetch: () => {
      // Clear cache and refetch from contracts only
      if (address) {
        invalidateWalletCache(address);
        checkWallet();
      }
    },
    // Simplified returns
    userRole: currentUserRole,
    dataSource: "contract" as const, // Always contract
    invalidateCache: () => address && invalidateWalletCache(address),
  };
};

export const useWalletCreationFlow = () => {
  const { address, isConnected, chainId } = useAccount();
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
        address,
        chainId
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
      return null;
    }

    return null;
  }, [publicClient, address, isConnected, chainId]);

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
          formData,
          chainId
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
    [publicClient, walletClient, address, isConnected, chainId]
  );

  // Sign wallet creation
  const signCreation = useCallback(
    async (requestId: number) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error("Wallet not connected");
      }

      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      try {
        await signWalletCreation(
          walletClient,
          publicClient,
          requestId,
          chainId
        );

        // Refresh request state
        const updatedRequest = await getCreationRequest(
          publicClient,
          requestId,
          chainId
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
    [publicClient, walletClient, isConnected, chainId]
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
          requestId,
          chainId
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
    [publicClient, walletClient, isConnected, chainId]
  );

  // Complete the creation process with backend integration
  const completeCreation = useCallback(
    async (
      formData?: CreateWalletFormData,
      agentWalletAddress?: string,
      agentWalletPrivateKey?: string
    ) => {
      if (!address || !state.walletAddress || !formData) {
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
          // Wait for the hook to load and get accurate data
          let retryCount = 0;
          const maxRetries = 5;

          while (retryCount < maxRetries) {
            if (isLoadingRollbackWallet) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            }

            if (
              rollbackWalletData?.hasWallet &&
              rollbackWalletData?.walletAddress
            ) {
              realWalletAddress = rollbackWalletData.walletAddress;

              // Update state with real address
              setState((prev) => ({
                ...prev,
                walletAddress: realWalletAddress,
              }));
              break;
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retryCount++;
            }
          }

          if (
            retryCount >= maxRetries &&
            realWalletAddress === "WALLET_CREATED_PENDING"
          ) {
            // Continue with placeholder - better to store something than nothing
          }
        }

        // Step 2: Create or get agent wallet from backend
        let agentWallet = agentWalletAddress;
        if (!agentWallet) {
          try {
            const createdAgent = await createAgentWallet();
            agentWallet = createdAgent.address;
          } catch (agentError) {
            // Continue without agent wallet - can be added later
          }
        }

        // Step 3: Store user data in backend for monitoring
        let backendIntegrated = false;
        try {
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

          // Add small delay to ensure all blockchain operations are complete
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

          const backendResult = await updateBackendWithWalletData({
            userAddress: address,
            rollbackWalletAddress: realWalletAddress,
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

          backendIntegrated = true;
        } catch (backendError: any) {
          // Wallet creation still succeeded, just no backend monitoring
        }

        setState((prev) => ({
          ...prev,
          step: "completed",
          isCreating: false,
        }));

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
    [
      address,
      state.walletAddress,
      rollbackWalletData,
      isLoadingRollbackWallet,
      chainId,
    ]
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

// Enhanced hook to check actual approval status across all monitored wallets and tokens
export const useApprovalWarningStatus = (user: any) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [warningStatus, setWarningStatus] = useState({
    showWarning: false,
    unapprovedCount: 0,
    totalTokens: 0,
    unapprovedTokens: [] as string[],
    isLoading: true,
  });

  // Get rollback wallet address from user data
  const rollbackWalletAddress = user?.rollbackConfig
    ?.rollback_wallet_address as Address;

  // Get all wallets associated with the rollback system
  const { data: allWalletsData, isLoading: loadingWallets } = useGetAllWallets(
    rollbackWalletAddress,
    !!rollbackWalletAddress
  );

  // Get monitored tokens
  const { data: monitoredTokensData, isLoading: loadingTokens } =
    useGetMonitoredTokens(rollbackWalletAddress, !!rollbackWalletAddress);

  // Parse wallet data
  const activeWallets = useMemo(() => {
    if (!allWalletsData) return [];
    return (allWalletsData as any[])
      .filter((w) => !w.isObsolete)
      .map((w) => ({
        address: w.walletAddress as string,
        isConnected: w.walletAddress.toLowerCase() === address?.toLowerCase(),
      }));
  }, [allWalletsData, address]);

  // Parse token data
  const monitoredTokens = useMemo(() => {
    if (!monitoredTokensData) return [];
    const [addresses, types] = monitoredTokensData as [string[], number[]];
    return addresses.map((addr, i) => ({
      address: addr,
      type: types[i] === 0 ? ("ERC20" as const) : ("ERC721" as const),
    }));
  }, [monitoredTokensData]);

  // Create a list of all approval checks we need to make
  const approvalChecks = useMemo(() => {
    if (
      !rollbackWalletAddress ||
      !activeWallets.length ||
      !monitoredTokens.length
    ) {
      return [];
    }

    const checks: Array<{
      id: string;
      tokenAddress: Address;
      tokenType: "ERC20" | "ERC721";
      walletAddress: Address;
      spenderAddress: Address;
    }> = [];

    activeWallets.forEach((wallet) => {
      monitoredTokens.forEach((token) => {
        checks.push({
          id: `${wallet.address}-${token.address}`,
          tokenAddress: token.address as Address,
          tokenType: token.type,
          walletAddress: wallet.address as Address,
          spenderAddress: rollbackWalletAddress,
        });
      });
    });

    return checks;
  }, [rollbackWalletAddress, activeWallets, monitoredTokens]);

  // Check approval statuses
  useEffect(() => {
    if (
      !rollbackWalletAddress ||
      !user?.rollbackConfig?.tokens_to_monitor?.length ||
      !address
    ) {
      setWarningStatus({
        showWarning: false,
        unapprovedCount: 0,
        totalTokens: 0,
        unapprovedTokens: [],
        isLoading: false,
      });
      return;
    }

    if (
      loadingWallets ||
      loadingTokens ||
      !approvalChecks.length ||
      !publicClient
    ) {
      setWarningStatus((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    const checkApprovals = async () => {
      try {
        const approvalPromises = approvalChecks.map(async (check) => {
          try {
            const result = await publicClient.readContract({
              address: check.tokenAddress,
              abi: check.tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
              functionName:
                check.tokenType === "ERC20" ? "allowance" : "isApprovedForAll",
              args: [check.walletAddress, check.spenderAddress],
            });

            if (check.tokenType === "ERC20") {
              // For ERC20, check if allowance > 0
              return {
                ...check,
                isApproved: BigInt(result as bigint) > 0n,
              };
            } else {
              // For ERC721, check boolean approval
              return {
                ...check,
                isApproved: result as boolean,
              };
            }
          } catch (error) {
            return {
              ...check,
              isApproved: false, // Assume not approved if check fails
            };
          }
        });

        const approvalResults = await Promise.all(approvalPromises);

        // Group by token address to avoid counting the same token multiple times
        const tokenApprovalMap = new Map<
          string,
          {
            address: string;
            symbol?: string;
            hasAnyApproval: boolean;
          }
        >();

        approvalResults.forEach((result) => {
          const existing = tokenApprovalMap.get(result.tokenAddress);
          if (existing) {
            // If any wallet has approval for this token, mark as approved
            existing.hasAnyApproval =
              existing.hasAnyApproval || result.isApproved;
          } else {
            tokenApprovalMap.set(result.tokenAddress, {
              address: result.tokenAddress,
              hasAnyApproval: result.isApproved,
            });
          }
        });

        const tokenStatuses = Array.from(tokenApprovalMap.values());
        const unapprovedTokens = tokenStatuses.filter(
          (token) => !token.hasAnyApproval
        );

        setWarningStatus({
          showWarning: unapprovedTokens.length > 0,
          unapprovedCount: unapprovedTokens.length,
          totalTokens: tokenStatuses.length,
          unapprovedTokens: unapprovedTokens.map(
            (token) =>
              user.rollbackConfig.tokens_to_monitor.find(
                (t: any) =>
                  t.address.toLowerCase() === token.address.toLowerCase()
              )?.symbol || token.address.slice(0, 8)
          ),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error checking approval statuses:", error);
        // Fallback to showing warning if we can't check
        setWarningStatus({
          showWarning: true,
          unapprovedCount: monitoredTokens.length,
          totalTokens: monitoredTokens.length,
          unapprovedTokens: monitoredTokens.map((t) => t.address.slice(0, 8)),
          isLoading: false,
        });
      }
    };

    checkApprovals();
  }, [
    user,
    address,
    rollbackWalletAddress,
    loadingWallets,
    loadingTokens,
    approvalChecks,
    monitoredTokens,
    publicClient,
  ]);

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
