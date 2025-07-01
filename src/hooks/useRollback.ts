import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { type Address } from "viem";
import { config } from "@/config/env";
import { TOKEN_TYPE, ERC20_ABI, ERC721_ABI } from "@/config/contracts";
import {
  checkPendingCreationRequests,
  proposeWalletCreation,
  signWalletCreation,
  finalizeWalletCreation,
  getInitializationFee,
  getCreationRequest,
  approveERC20Token,
  approveERC721Token,
  type CreationRequest,
} from "@/lib/contracts";
import type {
  CreateWalletFormData,
  AgentWallet,
  UserData,
  WalletInfo,
  TokenToMonitor,
} from "@/types/api";
import { useAppStore } from "@/stores/appStore";
import { useCompleteWalletData } from "./contracts/useSimpleRollbackRead";

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

// Enhanced hook to fetch rollback wallet data with contract only (no backend)
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

  // Use the comprehensive contract data hook
  const {
    data: contractData,
    hasWallet,
    walletAddress,
    userRole,
    isLoading: isLoadingContract,
    error: contractError,
  } = useCompleteWalletData(address, isConnected);

  // For backward compatibility - convert to old structure
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
  const [isFromContract, setIsFromContract] = useState(true); // Always from contract now

  const checkWallet = useCallback(async () => {
    if (!address || !isConnected) {
      console.log("❌ Wallet not connected, clearing data");
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
      setIsFromContract(true);
      setLoading(false);
      setHasInitiallyChecked(true);
      return;
    }

    console.log("🔍 Starting contract-only wallet check for address:", address);
    setLoading(true);

    try {
      // Check cache first
      const cachedData = getWalletData(address);
      if (cachedData && cachedData.data) {
        console.log("📋 Found cached wallet data");
        setUserData(cachedData.data);
        setHasRollbackWallet(true);
        setRollbackWalletAddress(
          cachedData.data.rollbackConfig.rollback_wallet_address
        );
        setCurrentUserRole(cachedData.userRole);
        setIsFromContract(true);
        setLoading(false);
        setHasInitiallyChecked(true);
        return;
      }

      // Wait for contract data if still loading
      if (isLoadingContract) {
        console.log("⏳ Contract data still loading...");
        return;
      }

      // Use contract data directly (no backend calls)
      if (hasWallet && contractData && walletAddress) {
        console.log("✅ Found wallet data from contract");

        // Cache the data
        setWalletData(address, contractData, userRole || "owner", true);
        setUserData(contractData);
        setHasRollbackWallet(true);
        setRollbackWalletAddress(walletAddress);
        setCurrentUserRole(userRole || "owner");
        setIsFromContract(true);

        console.log("✅ Contract-only wallet detection successful");
      } else {
        console.log("❌ No wallet found for address:", address);
        setUserData(null);
        setHasRollbackWallet(false);
        setRollbackWalletAddress(null);
        setCurrentUserRole(null);
        setIsFromContract(true);
      }
    } catch (error) {
      console.error("❌ Error during contract wallet check:", error);
      setUserData(null);
      setHasRollbackWallet(false);
      setRollbackWalletAddress(null);
      setCurrentUserRole(null);
      setIsFromContract(true);
    } finally {
      setLoading(false);
      setHasInitiallyChecked(true);
      console.log("🔄 Contract-only wallet check completed");
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

  // Enhanced loading state logic
  const shouldShowLoading =
    isConnected && !hasInitiallyChecked && (loading || isLoadingContract);

  return {
    // Backward compatible returns for existing dashboard
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
      // Clear cache and refetch
      if (address) {
        invalidateWalletCache(address);
        checkWallet();
      }
    },
    // Enhanced returns
    userRole: currentUserRole,
    isFromContract,
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

  // Complete the creation process (contract-only, no backend)
  const completeCreation = useCallback(
    async (formData?: CreateWalletFormData, agentWalletAddress?: string) => {
      setState((prev) => ({
        ...prev,
        step: "completed",
        isCreating: false,
      }));

      // Contract-only implementation - no backend updates needed
      console.log("✅ Wallet creation completed successfully (contract-only)");
    },
    []
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

export const useTokenPortfolio = (user: UserData | null) => {
  const publicClient = usePublicClient();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenInfo = useCallback(
    async (
      tokenAddress: string,
      tokenType: string
    ): Promise<Partial<TokenInfo>> => {
      if (!publicClient) return {};

      try {
        if (tokenType === "ERC20") {
          const [symbol, name, decimals] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "name",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "decimals",
            }),
          ]);

          return {
            symbol: symbol as string,
            name: name as string,
            decimals: decimals as number,
            type: "ERC20" as const,
          };
        } else if (tokenType === "ERC721") {
          const [symbol, name] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "name",
            }),
          ]);

          return {
            symbol: symbol as string,
            name: name as string,
            decimals: 0,
            type: "ERC721" as const,
          };
        }
      } catch (err) {
        console.error(`Error fetching token info for ${tokenAddress}:`, err);
        return {
          symbol: "UNKNOWN",
          name: "Unknown Token",
          decimals: 18,
          type: tokenType as "ERC20" | "ERC721",
        };
      }

      return {};
    },
    [publicClient]
  );

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
      const wallets = user.wallets || [];

      const tokenInfoPromises = tokens_to_monitor.map(async (token) => {
        const info = await fetchTokenInfo(token.address, token.type);

        // Fetch balances for all wallets
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
