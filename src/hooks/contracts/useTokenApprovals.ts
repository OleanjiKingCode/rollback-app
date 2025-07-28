import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { type Address } from "viem";
import { ERC20_ABI, ERC721_ABI } from "@/config/contracts";
import {
  useSimpleFindRollbackWallet,
  useGetAllWallets,
  useGetMonitoredTokens,
} from "./useSimpleRollbackRead";
import {
  useWriteApproveERC20,
  useWriteApproveERC721,
} from "./useRollbackWrite";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  type: "ERC20" | "ERC721";
  decimals?: number;
}

export interface WalletTokenData {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenType: "ERC20" | "ERC721";
  balance: string;
  allowance?: string;
  isApproved: boolean;
  decimals?: number;
}

export interface WalletData {
  address: string;
  isConnected: boolean;
  tokens: WalletTokenData[];
}

export const useTokenApprovals = () => {
  const { address, isConnected } = useAccount();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTokenAmount = useCallback(
    (amount: string, decimals: number = 18): string => {
      try {
        if (!amount || amount === "0") return "0";
        const bigAmount = BigInt(amount);
        const divisor = 10n ** BigInt(decimals);
        const quotient = bigAmount / divisor;
        const remainder = bigAmount % divisor;

        if (remainder === 0n) return quotient.toString();

        const remainderStr = remainder.toString().padStart(decimals, "0");
        const trimmed = remainderStr.replace(/0+$/, "");
        return trimmed ? `${quotient}.${trimmed}` : quotient.toString();
      } catch {
        return "0";
      }
    },
    []
  );

  const parseTokenAmount = useCallback(
    (amount: string, decimals: number = 18): string => {
      if (!amount || amount === "0") return "0";
      const parts = amount.split(".");
      const wholePart = parts[0] || "0";
      const fractionalPart = (parts[1] || "")
        .padEnd(decimals, "0")
        .slice(0, decimals);
      return (
        BigInt(wholePart) * BigInt(10 ** decimals) +
        BigInt(fractionalPart || "0")
      ).toString();
    },
    []
  );

  const { data: rollbackWalletResult, isLoading: loadingRollback } =
    useSimpleFindRollbackWallet(address, isConnected);

  const rollbackWalletAddress = useMemo(() => {
    if (
      rollbackWalletResult?.hasWallet &&
      rollbackWalletResult?.walletAddress
    ) {
      return rollbackWalletResult.walletAddress;
    }

    return null;
  }, [rollbackWalletResult]);

  const { data: allWalletsData, isLoading: loadingWallets } = useGetAllWallets(
    rollbackWalletAddress as Address,
    !!rollbackWalletAddress
  );

  const { data: monitoredTokensData, isLoading: loadingTokens } =
    useGetMonitoredTokens(
      rollbackWalletAddress as Address,
      !!rollbackWalletAddress
    );

  const activeWallets = useMemo(() => {
    if (!allWalletsData) return [];
    return (allWalletsData as any[])
      .filter((w) => !w.isObsolete)
      .map((w) => ({
        address: w.walletAddress as string,
        isConnected: w.walletAddress.toLowerCase() === address?.toLowerCase(),
      }));
  }, [allWalletsData, address]);

  const parsedTokens = useMemo(() => {
    if (!monitoredTokensData) return [];
    const [addresses, types] = monitoredTokensData as [string[], number[]];
    return addresses.map((addr, i) => ({
      address: addr,
      type: types[i] === 0 ? ("ERC20" as const) : ("ERC721" as const),
      symbol: "Loading...",
      name: "Loading...",
      decimals: types[i] === 0 ? 18 : undefined,
    }));
  }, [monitoredTokensData]);

  useEffect(() => {
    if (
      !rollbackWalletAddress ||
      activeWallets.length === 0 ||
      parsedTokens.length === 0
    ) {
      setWallets([]);
      setTokens([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const walletData: WalletData[] = activeWallets.map((wallet) => ({
          address: wallet.address,
          isConnected: wallet.isConnected,
          tokens: parsedTokens.map((token) => ({
            tokenAddress: token.address,
            tokenSymbol: token.address.slice(0, 8),
            tokenName: `Token ${token.address.slice(0, 8)}`,
            tokenType: token.type,
            balance: "0",
            allowance: token.type === "ERC20" ? "0" : undefined,
            isApproved: false,
            decimals: token.decimals,
          })),
        }));

        if (!cancelled) {
          setWallets(walletData);
          setTokens(parsedTokens);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load token data");
          setLoading(false);
        }
      }
    };
    loadData();

    return () => {
      cancelled = true;
    };
  }, [rollbackWalletAddress, activeWallets.length, parsedTokens.length]);

  const refetchAll = useCallback(async () => {
    setWallets([]);
    setLoading(true);
  }, []);

  const isMainLoading =
    loadingRollback || loadingWallets || loadingTokens || loading;
  const hasRollbackWallet = !!rollbackWalletAddress;

  return {
    // State
    isConnected,
    hasRollbackWallet,
    rollbackWalletAddress: rollbackWalletAddress || "",
    wallets,
    tokens,
    isLoading: isMainLoading,
    error,

    // Actions
    refetchAll,

    // Utilities
    formatTokenAmount,
    parseTokenAmount,
  };
};

export const useSimpleTokenApproval = (
  tokenAddress?: Address,
  tokenType?: "ERC20" | "ERC721",
  spenderAddress?: Address,
  approvalAmount?: string
) => {
  const { address } = useAccount();

  // Get current allowance/approval status
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: tokenType === "ERC20" ? "allowance" : "isApprovedForAll",
    args: [address as Address, spenderAddress as Address],
    query: {
      enabled: !!tokenAddress && !!address && !!spenderAddress,
    },
  });

  // Get token balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "balanceOf",
    args: [address as Address],
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  // Get token info
  const { data: symbolData } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: nameData } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress },
  });

  const { data: decimalsData } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress && tokenType === "ERC20" },
  });

  const erc20Approve = useWriteApproveERC20(
    tokenType === "ERC20" ? tokenAddress : undefined,
    spenderAddress,
    approvalAmount,
    () => {
      refetchAllowance();
      refetchBalance();
    }
  );

  const erc20Revoke = useWriteApproveERC20(
    tokenType === "ERC20" ? tokenAddress : undefined,
    spenderAddress,
    "0",
    () => {
      refetchAllowance();
      refetchBalance();
    }
  );

  const erc721Approve = useWriteApproveERC721(
    tokenType === "ERC721" ? tokenAddress : undefined,
    spenderAddress,
    true,
    () => {
      refetchAllowance();
      refetchBalance();
    }
  );

  // Separate revoke hook for ERC721
  const erc721Revoke = useWriteApproveERC721(
    tokenType === "ERC721" ? tokenAddress : undefined,
    spenderAddress,
    false,
    () => {
      refetchAllowance();
      refetchBalance();
    }
  );

  const erc20ApproveLoading = useMemo(() => {
    return (
      erc20Approve.simFetchStatus === "fetching" ||
      erc20Approve.status === "pending"
    );
  }, [erc20Approve.simFetchStatus, erc20Approve.status]);

  const erc20RevokeLoading = useMemo(() => {
    return (
      erc20Revoke.simFetchStatus === "fetching" ||
      erc20Revoke.status === "pending"
    );
  }, [erc20Revoke.simFetchStatus, erc20Revoke.status]);

  // ERC721 loading states (simulation fetching + transaction pending)
  const erc721ApproveLoading = useMemo(() => {
    return (
      erc721Approve.simFetchStatus === "fetching" ||
      erc721Approve.status === "pending"
    );
  }, [erc721Approve.simFetchStatus, erc721Approve.status]);

  const erc721RevokeLoading = useMemo(() => {
    return (
      erc721Revoke.simFetchStatus === "fetching" ||
      erc721Revoke.status === "pending"
    );
  }, [erc721Revoke.simFetchStatus, erc721Revoke.status]);

  // Combined loading states
  const isApproving = useMemo(() => {
    if (tokenType === "ERC20") {
      return erc20ApproveLoading;
    } else {
      return erc721ApproveLoading;
    }
  }, [tokenType, erc20ApproveLoading, erc721ApproveLoading]);

  const isRevoking = useMemo(() => {
    if (tokenType === "ERC20") {
      return erc20RevokeLoading;
    } else {
      return erc721RevokeLoading;
    }
  }, [tokenType, erc20RevokeLoading, erc721RevokeLoading]);

  const isLoading = useMemo(() => {
    return isApproving || isRevoking;
  }, [isApproving, isRevoking]);

  // Approve function
  const approve = useCallback(async () => {
    try {
      if (tokenType === "ERC20") {
        await erc20Approve.approveToken();
      } else {
        await erc721Approve.approveNFT();
      }
    } catch (error) {
      throw error;
    }
  }, [tokenType, erc20Approve.approveToken, erc721Approve.approveNFT]);

  // Revoke function
  const revoke = useCallback(async () => {
    try {
      if (tokenType === "ERC20") {
        await erc20Revoke.approveToken();
      } else {
        await erc721Revoke.approveNFT();
      }
    } catch (error) {
      throw error;
    }
  }, [tokenType, erc20Revoke.approveToken, erc721Revoke.approveNFT]);

  // Get max balance for input field
  const getMaxAmount = useCallback(() => {
    return balanceData?.toString() || "0";
  }, [balanceData]);

  const isApproved = useMemo(() => {
    if (tokenType === "ERC20") {
      return (
        allowanceData &&
        balanceData &&
        BigInt(allowanceData as bigint) >= BigInt(balanceData as bigint)
      );
    } else {
      return allowanceData as boolean;
    }
  }, [allowanceData, balanceData, tokenType]);

  // Consolidated error from all hooks
  const error = useMemo(() => {
    return (
      erc20Approve.error ||
      erc20Revoke.error ||
      erc721Approve.error ||
      erc721Revoke.error
    );
  }, [
    erc20Approve.error,
    erc20Revoke.error,
    erc721Approve.error,
    erc721Revoke.error,
  ]);

  return {
    // Data
    balance: balanceData?.toString() || "0",
    allowance:
      tokenType === "ERC20"
        ? (allowanceData as bigint)?.toString() || "0"
        : "0",
    symbol: (symbolData as string) || "TOKEN",
    name: (nameData as string) || "Unknown",
    decimals: (decimalsData as number) || 18,
    isApproved,

    // Loading states - granular control for each token type and operation
    isLoading, // Overall loading state
    isApproving, // Combined approving state for current token type
    isRevoking, // Combined revoking state for current token type

    // Individual ERC20 loading states
    erc20ApproveLoading,
    erc20RevokeLoading,

    // Individual ERC721 loading states
    erc721ApproveLoading,
    erc721RevokeLoading,

    // Actions
    approve,
    revoke,
    getMaxAmount,
    error,

    // Refetch
    refetch: () => {
      refetchAllowance();
      refetchBalance();
    },
  };
};

export const useTokenData = (
  tokenAddress?: Address,
  tokenType?: "ERC20" | "ERC721",
  walletAddress?: Address
) => {
  // Get token balance for specific wallet
  const { data: balanceData } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "balanceOf",
    args: [walletAddress as Address],
    query: {
      enabled: !!tokenAddress && !!walletAddress,
    },
  });

  // Get token info
  const { data: symbolData } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: nameData } = useReadContract({
    address: tokenAddress,
    abi: tokenType === "ERC20" ? ERC20_ABI : ERC721_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress },
  });

  const { data: decimalsData } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress && tokenType === "ERC20" },
  });

  return {
    balance: balanceData?.toString() || "0",
    symbol: (symbolData as string) || tokenAddress?.slice(0, 8) || "TOKEN",
    name:
      (nameData as string) || `Token ${tokenAddress?.slice(0, 8)}` || "Unknown",
    decimals: (decimalsData as number) || 18,
  };
};

export const useTokenApproval = useSimpleTokenApproval;
