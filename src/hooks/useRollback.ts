import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useUser, createUser, createAgentWallet, addWallet } from "@/lib/api";
import { TOKEN_TYPE, ERC20_ABI, ERC721_ABI } from "@/config/contracts";
import {
  checkRollbackWallet,
  proposeWalletCreation,
  signWalletCreation,
  finalizeWalletCreation,
  getInitializationFee,
  approveERC20Token,
  approveERC721Token,
} from "@/lib/contracts";
import type {
  CreateWalletFormData,
  AgentWallet,
  CreateWalletParams,
  UserData,
} from "@/types/api";

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

export const useRollbackWallet = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { user, isLoading, isError, mutate } = useUser(address);

  const [rollbackWalletAddress, setRollbackWalletAddress] = useState<
    string | null
  >(null);
  const [isChecking, setIsChecking] = useState(false);

  // Determine if user has rollback wallet based on API data (not mocked contract)
  const hasRollbackWallet = user && user.rollbackConfig ? true : false;

  // Debug logging

  const checkWallet = useCallback(async () => {
    if (user && user.rollbackConfig) {
      setRollbackWalletAddress(user.rollbackConfig.agent_wallet || null);
    } else {
      console.log("❌ No user found in API");
      setRollbackWalletAddress(null);
    }
  }, [user]);

  return {
    user,
    hasRollbackWallet,
    rollbackWalletAddress,
    isLoading: isLoading || isChecking,
    isError: isError && user !== null, // Don't treat "user not found" as error
    checkRollbackWallet: checkWallet,
    refetch: mutate,
  };
};

export const useCreateRollbackWallet = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<string>("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [agentWallet, setAgentWallet] = useState<AgentWallet | null>(null);

  const createWallet = useCallback(
    async (formData: CreateWalletFormData) => {
      if (!publicClient || !walletClient || !address || !isConnected) {
        throw new Error(
          "Wallet not connected or contract service not available"
        );
      }

      setIsCreating(true);
      try {
        // Step 1: Create agent wallet
        setCreationStep("Creating agent wallet...");
        const agent = await createAgentWallet();
        setAgentWallet(agent);

        // Step 2: Prepare contract parameters
        setCreationStep("Preparing wallet parameters...");
        const tokenAddresses = formData.tokensToMonitor.map((t) => t.address);
        const tokenTypes = formData.tokensToMonitor.map((t) =>
          t.type === "ERC20" ? TOKEN_TYPE.ERC20 : TOKEN_TYPE.ERC721
        );

        const params: CreateWalletParams = {
          user: address,
          wallets: formData.wallets,
          threshold: formData.threshold,
          tokensToMonitor: tokenAddresses,
          tokenTypes,
          isRandomized: formData.isRandomized,
          fallbackWallet: formData.fallbackWallet,
          agentWallet: agent.address,
        };

        // Step 3: Propose wallet creation
        setCreationStep("Proposing wallet creation...");
        const proposalRequestId = await proposeWalletCreation(
          walletClient,
          publicClient,
          params
        );
        setRequestId(proposalRequestId);

        // Step 4: Create user in database
        setCreationStep("Storing user information...");
        await createUser({
          walletAddress: address,
          rollbackConfig: {
            inactivityThreshold: formData.threshold,
            rollbackType: formData.isRandomized ? "randomized" : "sequential",
            isRandomized: formData.isRandomized,
            fallbackWallet: formData.fallbackWallet,
            agentWallet: agent.address,
          },
        });

        // Step 5: Add wallets to database
        setCreationStep("Adding wallets to monitoring...");
        for (const walletAddr of formData.wallets) {
          if (walletAddr !== address) {
            await addWallet(address, walletAddr);
          }
        }

        setCreationStep("Wallet creation proposed successfully!");
        return {
          requestId: proposalRequestId,
          agentWallet: agent,
          needsSignatures: formData.wallets.length > 1,
          totalSignersNeeded: formData.wallets.length,
        };
      } catch (error) {
        console.error("Error creating rollback wallet:", error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [publicClient, walletClient, address, isConnected]
  );

  return {
    createWallet,
    isCreating,
    creationStep,
    requestId,
    agentWallet,
  };
};

export const useSignWalletCreation = () => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isSigning, setIsSigning] = useState(false);

  const signCreation = useCallback(
    async (requestId: number) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error(
          "Wallet not connected or contract service not available"
        );
      }

      setIsSigning(true);
      try {
        await signWalletCreation(walletClient, publicClient, requestId);
      } catch (error) {
        console.error("Error signing wallet creation:", error);
        throw error;
      } finally {
        setIsSigning(false);
      }
    },
    [publicClient, walletClient, isConnected]
  );

  return {
    signCreation,
    isSigning,
  };
};

export const useFinalizeWalletCreation = () => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isFinalizing, setIsFinalizing] = useState(false);

  const finalizeCreation = useCallback(
    async (requestId: number) => {
      if (!publicClient || !walletClient || !isConnected) {
        throw new Error(
          "Wallet not connected or contract service not available"
        );
      }

      setIsFinalizing(true);
      try {
        // Get initialization fee
        const fee = await getInitializationFee(publicClient);

        // Finalize with payment
        await finalizeWalletCreation(
          walletClient,
          publicClient,
          requestId,
          fee
        );
      } catch (error) {
        console.error("Error finalizing wallet creation:", error);
        throw error;
      } finally {
        setIsFinalizing(false);
      }
    },
    [publicClient, walletClient, isConnected]
  );

  return {
    finalizeCreation,
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
      const distributionData = tokens.map((token, index) => ({
        name: token.symbol,
        value: parseFloat(token.totalBalance) / Math.pow(10, token.decimals),
        fill: colors[index % colors.length],
        percentage: tokens.length > 0 ? Math.round(100 / tokens.length) : 0,
      }));

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
