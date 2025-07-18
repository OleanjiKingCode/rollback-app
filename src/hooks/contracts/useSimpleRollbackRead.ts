import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { ROLLBACK_MANAGER_ABI, ROLLBACK_WALLET_ABI } from "@/config/contracts";
import { config } from "@/config/env";
import { useMemo } from "react";

const ROLLBACK_MANAGER_ADDRESS = config.rollbackManagerAddress as Address;

/**
 * Simple hook to check if a user has a rollback wallet directly
 */
export const useCheckDirectRollbackWallet = (
  userAddress?: Address,
  enabled: boolean = true
) => {
  return useReadContract({
    address: ROLLBACK_MANAGER_ADDRESS,
    abi: ROLLBACK_MANAGER_ABI,
    functionName: "getUserWallet",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!userAddress,
    },
  });
};

/**
 * Simple hook to get all creation requests from RollbackWalletManager
 */
export const useGetAllCreationRequests = (enabled: boolean = true) => {
  return useReadContract({
    address: ROLLBACK_MANAGER_ADDRESS,
    abi: ROLLBACK_MANAGER_ABI,
    functionName: "getAllCreationRequests",
    query: {
      enabled,
      staleTime: 30000,
      retry: 2,
    },
  });
};

/**
 * Hook to get system config from a rollback wallet
 */
export const useGetWalletSystemConfig = (
  walletAddress?: Address,
  enabled: boolean = true
) => {
  return useReadContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "getSystemConfig",
    query: {
      enabled: enabled && !!walletAddress,
      staleTime: 30000,
      retry: 2,
    },
  });
};

/**
 * Hook to get all wallets from a rollback wallet
 */
export const useGetAllWallets = (
  walletAddress?: Address,
  enabled: boolean = true
) => {
  return useReadContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "getAllWallets",
    query: {
      enabled: enabled && !!walletAddress,
      staleTime: 30000,
      retry: 2,
    },
  });
};

/**
 * Hook to get monitored tokens from a rollback wallet
 */
export const useGetMonitoredTokens = (
  walletAddress?: Address,
  enabled: boolean = true
) => {
  return useReadContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "getMonitoredTokens",
    query: {
      enabled: enabled && !!walletAddress,
      staleTime: 30000,
      retry: 2,
    },
  });
};

/**
 * Hook to get all votes from a rollback wallet
 */
export const useGetAllVotes = (
  walletAddress?: Address,
  enabled: boolean = true
) => {
  return useReadContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "getAllVotes",
    query: {
      enabled: enabled && !!walletAddress,
    },
  });
};

/**
 * Hook to find if user is in any rollback system (as owner or recovery wallet)
 */
export const useSimpleFindRollbackWallet = (
  userAddress?: Address,
  enabled: boolean = true
) => {
  // Check if user is primary owner
  const {
    data: directWalletAddress,
    isLoading: isLoadingDirect,
    error: directError,
  } = useCheckDirectRollbackWallet(userAddress, enabled);

  console.log(userAddress, directWalletAddress);

  // Check all creation requests to see if user is in any system
  const {
    data: allRequests,
    isLoading: isLoadingRequests,
    error: requestsError,
  } = useGetAllCreationRequests(enabled && !directWalletAddress);

  const result = useMemo(() => {
    if (!userAddress) {
      return {
        hasWallet: false,
        walletAddress: null,
        userRole: null,
        primaryUser: null,
      };
    }

    // If found as primary owner
    if (
      directWalletAddress &&
      directWalletAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      return {
        hasWallet: true,
        walletAddress: directWalletAddress as string,
        userRole: "owner" as const,
        primaryUser: userAddress,
      };
    }

    // Check in creation requests for recovery wallet role
    if (allRequests && Array.isArray(allRequests) && allRequests.length === 2) {
      try {
        const [requestIds, requests] = allRequests as [bigint[], any[]];

        // Only check executed requests
        const executedRequests = requests.filter(
          (request: any) => request?.executed
        );

        for (const request of executedRequests) {
          if (!request?.params) continue;

          const isInWallets = request.params.wallets?.some?.(
            (wallet: string) =>
              wallet?.toLowerCase() === userAddress.toLowerCase()
          );
          const isPrimaryUser =
            request.params.user?.toLowerCase() === userAddress.toLowerCase();

          if (isInWallets || isPrimaryUser) {
            return {
              hasWallet: true,
              walletAddress: "",
              userRole: isPrimaryUser
                ? ("owner" as const)
                : ("recovery_wallet" as const),
              primaryUser: request.params.user,
            };
          }
        }
      } catch (error) {
        console.warn("Error processing creation requests:", error);
      }
    }

    return {
      hasWallet: false,
      walletAddress: null,
      userRole: null,
      primaryUser: null,
    };
  }, [userAddress, directWalletAddress, allRequests]);

  // If we found the user but need to get their primary wallet address
  const { data: primaryWalletAddress } = useCheckDirectRollbackWallet(
    result.primaryUser as Address,
    enabled && !!result.primaryUser && result.hasWallet && !result.walletAddress
  );

  const finalResult = useMemo(() => {
    if (result.hasWallet && result.walletAddress) {
      return result;
    }

    if (
      result.hasWallet &&
      primaryWalletAddress &&
      primaryWalletAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      return {
        ...result,
        walletAddress: primaryWalletAddress as string,
      };
    }

    return result;
  }, [result, primaryWalletAddress]);

  return {
    data: finalResult,
    isLoading: isLoadingDirect || isLoadingRequests,
    error: directError || requestsError,
  };
};

/**
 * Comprehensive hook to get complete wallet data from contract
 */
export const useCompleteWalletData = (
  userAddress?: Address,
  enabled: boolean = true
) => {
  // First find if user has a wallet
  const {
    data: walletResult,
    isLoading: isLoadingWallet,
    error: walletError,
  } = useSimpleFindRollbackWallet(userAddress, enabled);

  console.log({ userAddress, walletResult });

  const walletAddress = walletResult?.walletAddress as Address;
  const hasWallet = !!walletResult?.hasWallet && !!walletAddress;

  // Get system config
  const {
    data: systemConfig,
    isLoading: isLoadingConfig,
    error: configError,
  } = useGetWalletSystemConfig(walletAddress, enabled && hasWallet);

  // Get all wallets
  const {
    data: allWallets,
    isLoading: isLoadingWallets,
    error: walletsError,
  } = useGetAllWallets(walletAddress, enabled && hasWallet);

  // Get monitored tokens
  const {
    data: monitoredTokens,
    isLoading: isLoadingTokens,
    error: tokensError,
  } = useGetMonitoredTokens(walletAddress, enabled && hasWallet);

  // Combine all data into backward-compatible format
  const completeData = useMemo(() => {
    if (!hasWallet || !userAddress || !walletAddress) {
      return null;
    }

    // Parse system config
    const [
      threshold,
      isRandomized,
      fallbackWallet,
      agentWallet,
      treasuryAddress,
    ] = (systemConfig as [bigint, boolean, string, string, string]) || [
      BigInt(0),
      false,
      "",
      "",
      "",
    ];

    // Parse monitored tokens
    const [tokenAddresses, tokenTypes] = (monitoredTokens as [
      string[],
      number[]
    ]) || [[], []];
    const formattedTokens = tokenAddresses.map((address, index) => ({
      type: tokenTypes[index] === 0 ? "ERC20" : "ERC721",
      address: address,
    }));

    // Parse wallets
    const formattedWallets = ((allWallets as any[]) || []).map(
      (wallet, index) => ({
        id: `${walletAddress}-${index}`,
        user_id: userAddress,
        address: wallet.walletAddress,
        priority_position: Number(wallet.priorityPosition) || index,
        is_obsolete: wallet.isObsolete,
        last_activity: new Date(
          Number(wallet.lastActivity) * 1000
        ).toISOString(),
        balance_hash: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );

    return {
      user: {
        id: userAddress,
        address: userAddress,
        email: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      rollbackConfig: {
        id: walletAddress,
        user_id: userAddress,
        inactivity_threshold: Math.floor(Number(threshold) / 86400), // Convert seconds to days
        rollback_method: isRandomized ? "randomized" : "priority based",
        fallback_wallet: fallbackWallet,
        agent_wallet: agentWallet,
        rollback_wallet_address: walletAddress,
        tokens_to_monitor: formattedTokens,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      wallets: formattedWallets,
      agentWallet: {
        id: agentWallet,
        userId: userAddress,
        address: agentWallet,
        createdAt: new Date().toISOString(),
      },
    };
  }, [
    hasWallet,
    userAddress,
    walletAddress,
    systemConfig,
    allWallets,
    monitoredTokens,
  ]);

  return {
    data: completeData,
    hasWallet,
    walletAddress,
    userRole: walletResult?.userRole || null,
    isLoading:
      isLoadingWallet || isLoadingConfig || isLoadingWallets || isLoadingTokens,
    error: walletError || configError || walletsError || tokensError,
  };
};
