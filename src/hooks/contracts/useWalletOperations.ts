import { useState, useEffect, useRef, useCallback } from "react";
import { useSimulateContract, useWriteContract, useAccount } from "wagmi";
import { type Address, type BaseError } from "viem";
import { ROLLBACK_WALLET_ABI, VOTE_TYPE } from "@/config/contracts";
import { toastApi, sonnerToasts } from "@/lib/toast";

// Custom error class for Sentry integration
class CustomError extends Error {
  public title: string;
  public userAddress?: string;
  public originalError?: unknown;

  constructor(
    title: string,
    message: string,
    userAddress?: string,
    originalError?: unknown
  ) {
    super(message);
    this.title = title;
    this.userAddress = userAddress;
    this.originalError = originalError;
    this.name = "CustomError";
  }
}

interface VoteParams {
  voteType:
    | "AGENT_CHANGE"
    | "THRESHOLD_CHANGE"
    | "OBSOLETE_WALLET"
    | "EMERGENCY_RECOVERY";
  targetAddress: Address;
  targetValue: bigint;
}

/**
 * Hook for requesting votes in rollback wallet with dynamic parameters
 */
export const useWriteRequestVote = (walletAddress?: Address) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  const [enabled, setEnabled] = useState(false);
  const [voteParams, setVoteParams] = useState<VoteParams | null>(null);
  const [errorException, setErrorException] = useState<Error>();
  const toastIdRef = useRef<string | number>();
  const newFetchRef = useRef(false);

  const voteTypeNumber = voteParams
    ? VOTE_TYPE[voteParams.voteType]
    : undefined;

  const {
    data: simData,
    status: simStatus,
    error: simError,
    fetchStatus: simFetchStatus,
  } = useSimulateContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "requestVote",
    args: voteParams
      ? [voteTypeNumber!, voteParams.targetAddress, voteParams.targetValue]
      : undefined,
    query: {
      enabled:
        enabled &&
        !!walletAddress &&
        !!voteParams &&
        voteTypeNumber !== undefined,
    },
  });

  const {
    writeContract: writeRequestVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const voteTypeLabel =
          voteParams?.voteType === "OBSOLETE_WALLET"
            ? "Emergency Rollback"
            : voteParams?.voteType === "EMERGENCY_RECOVERY"
            ? "Emergency Recovery"
            : voteParams?.voteType.replace("_", " ") || "Vote";

        const toastId = LoadingSonner({
          message: `Requesting ${voteTypeLabel}`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess(data) {
        const voteTypeLabel =
          voteParams?.voteType === "OBSOLETE_WALLET"
            ? "Emergency Rollback"
            : voteParams?.voteType === "EMERGENCY_RECOVERY"
            ? "Emergency Recovery"
            : voteParams?.voteType.replace("_", " ") || "Vote";

        SuccessfulSonner({
          header: "Vote Request Submitted",
          message: `${voteTypeLabel} vote created successfully. Waiting for approvals.`,
          duration: 4000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
        setVoteParams(null);
      },
      onError(error) {
        const voteTypeLabel =
          voteParams?.voteType === "OBSOLETE_WALLET"
            ? "Emergency Rollback"
            : voteParams?.voteType === "EMERGENCY_RECOVERY"
            ? "Emergency Recovery"
            : voteParams?.voteType.replace("_", " ") || "Vote";

        ErrorSonner({
          header: "Vote Request Failed",
          message: `Failed to create ${voteTypeLabel} vote. Please try again.`,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
        setVoteParams(null);
      },
    },
  });

  useEffect(() => {
    if (simFetchStatus === "fetching") {
      newFetchRef.current = true;
    }
  }, [simFetchStatus]);

  useEffect(() => {
    if (
      newFetchRef.current &&
      enabled &&
      simStatus === "success" &&
      simData?.request
    ) {
      writeRequestVote(simData.request as any);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, writeRequestVote]);

  useEffect(() => {
    if (simError && enabled) {
      setEnabled(false);
      ErrorSonner({
        header: "Transaction Error",
        message: (simError as BaseError).shortMessage || "Simulation failed",
        toastProps: {
          id: toastIdRef.current,
        },
      });
      setVoteParams(null);
    }
  }, [simError, enabled]);

  useEffect(() => {
    if (writeError) {
      setErrorException(
        new CustomError(
          "Request Vote Error",
          writeError.message,
          address,
          writeError
        )
      );
    }
  }, [writeError, address]);

  useEffect(() => {
    if (writeStatus === "error") {
      writeReset();
      setVoteParams(null);
    }
  }, [writeStatus, writeReset]);

  useEffect(() => {
    if (errorException !== undefined) {
      // TODO: Add error tracking
    }
  }, [errorException]);

  const requestVote = useCallback(
    (
      voteType:
        | "AGENT_CHANGE"
        | "THRESHOLD_CHANGE"
        | "OBSOLETE_WALLET"
        | "EMERGENCY_RECOVERY",
      targetAddress: Address,
      targetValue: bigint = BigInt(0)
    ) => {
      const voteTypeNumber = VOTE_TYPE[voteType];

      setVoteParams({ voteType, targetAddress, targetValue });
      setEnabled(true);
    },
    [walletAddress]
  );

  return {
    requestVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for confirming votes in rollback wallet with dynamic parameters
 */
export const useWriteConfirmVote = (walletAddress?: Address) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  const [enabled, setEnabled] = useState(false);
  const [voteParams, setVoteParams] = useState<{
    voteId: number;
    approve: boolean;
  } | null>(null);
  const [errorException, setErrorException] = useState<Error>();
  const toastIdRef = useRef<string | number>();
  const newFetchRef = useRef(false);

  const {
    data: simData,
    status: simStatus,
    error: simError,
    fetchStatus: simFetchStatus,
  } = useSimulateContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "confirmVote",
    args: voteParams
      ? [BigInt(voteParams.voteId), voteParams.approve]
      : undefined,
    query: {
      enabled: enabled && !!walletAddress && !!voteParams,
    },
  });

  const {
    writeContract: writeConfirmVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const action = voteParams?.approve ? "Approving" : "Rejecting";
        const toastId = LoadingSonner({
          message: `${action} Vote #${voteParams?.voteId}`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        const action = voteParams?.approve ? "approved" : "rejected";
        SuccessfulSonner({
          header: "Vote Confirmed",
          message: `Vote #${voteParams?.voteId} ${action} successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
        setVoteParams(null);
      },
      onError() {
        const action = voteParams?.approve ? "approve" : "reject";
        ErrorSonner({
          header: "Vote Confirmation Failed",
          message: `Failed to ${action} vote. Please try again.`,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
        setVoteParams(null);
      },
    },
  });

  useEffect(() => {
    if (simFetchStatus === "fetching") {
      newFetchRef.current = true;
    }
  }, [simFetchStatus]);

  useEffect(() => {
    if (
      newFetchRef.current &&
      enabled &&
      simStatus === "success" &&
      simData?.request
    ) {
      writeConfirmVote(simData.request as any);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, writeConfirmVote]);

  useEffect(() => {
    if (simError && enabled) {
      setEnabled(false);
      ErrorSonner({
        header: "Transaction Error",
        message: (simError as BaseError).shortMessage || "Simulation failed",
        toastProps: {
          id: toastIdRef.current,
        },
      });
      setVoteParams(null);
    }
  }, [simError, enabled]);

  useEffect(() => {
    if (writeError) {
      setErrorException(
        new CustomError(
          "Confirm Vote Error",
          writeError.message,
          address,
          writeError
        )
      );
    }
  }, [writeError, address]);

  useEffect(() => {
    if (writeStatus === "error") {
      writeReset();
      setVoteParams(null);
    }
  }, [writeStatus, writeReset]);

  useEffect(() => {
    if (errorException !== undefined) {
      // TODO: Add error tracking
    }
  }, [errorException]);

  const confirmVote = useCallback((voteId: number, approve: boolean) => {
    setVoteParams({ voteId, approve });
    setEnabled(true);
  }, []);

  return {
    confirmVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Composite hook for complete vote management with proper parameter handling
 */
export const useVoteManagement = (walletAddress?: Address) => {
  const requestVoteHook = useWriteRequestVote(walletAddress);
  const confirmVoteHook = useWriteConfirmVote(walletAddress);

  // Specific request functions
  const requestAgentChange = (targetAddress: Address) => {
    requestVoteHook.requestVote("AGENT_CHANGE", targetAddress);
  };

  const requestThresholdChange = (newThresholdDays: number) => {
    const thresholdSeconds = BigInt(newThresholdDays * 24 * 60 * 60);
    requestVoteHook.requestVote(
      "THRESHOLD_CHANGE",
      "0x0000000000000000000000000000000000000000" as Address,
      thresholdSeconds
    );
  };

  const requestEmergencyRollback = (targetWalletAddress: Address) => {
    requestVoteHook.requestVote("OBSOLETE_WALLET", targetWalletAddress);
  };

  const requestEmergencyRecovery = (recoveryWalletAddress: Address) => {
    requestVoteHook.requestVote("EMERGENCY_RECOVERY", recoveryWalletAddress);
  };

  return {
    // Vote request functions with proper parameters
    requestAgentChange,
    requestThresholdChange,
    requestEmergencyRollback,
    requestEmergencyRecovery,
    // Generic request function for custom use
    requestVote: requestVoteHook.requestVote,

    // Vote confirmation function
    confirmVote: confirmVoteHook.confirmVote,

    // Loading states
    isRequestingVote: requestVoteHook.isLoading,
    isConfirmingVote: confirmVoteHook.isLoading,

    // Error states
    voteRequestError: requestVoteHook.error,
    voteConfirmError: confirmVoteHook.error,

    // Status tracking
    voteRequestStatus: requestVoteHook.status,
    voteConfirmStatus: confirmVoteHook.status,

    // Transaction data
    voteRequestData: requestVoteHook.data,
    voteConfirmData: confirmVoteHook.data,
  };
};

/**
 * Hook for direct wallet configuration updates
 */
export const useDirectWalletUpdates = (walletAddress?: Address) => {
  const { address, chain } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  // Update Fallback Wallet
  const {
    writeContract: updateFallback,
    isPending: isUpdatingFallback,
    error: fallbackError,
    isSuccess: fallbackSuccess,
  } = useWriteContract({
    mutation: {
      onMutate() {
        LoadingSonner({ message: "Updating fallback wallet..." });
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Success",
          message: "Fallback wallet updated successfully!",
        });
      },
      onError(error) {
        ErrorSonner({
          header: "Error",
          message: "Failed to update fallback wallet. Please try again.",
        });
      },
    },
  });

  // Update Wallet Priority
  const {
    writeContract: updatePriority,
    isPending: isUpdatingPriority,
    error: priorityError,
    isSuccess: prioritySuccess,
  } = useWriteContract({
    mutation: {
      onMutate() {
        LoadingSonner({ message: "Updating wallet priority..." });
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Success",
          message: "Wallet priority updated successfully!",
        });
      },
      onError(error) {
        ErrorSonner({
          header: "Error",
          message: "Failed to update wallet priority. Please try again.",
        });
      },
    },
  });

  // Update Randomization
  const {
    writeContract: updateRandomization,
    isPending: isUpdatingRandomization,
    error: randomizationError,
    isSuccess: randomizationSuccess,
  } = useWriteContract({
    mutation: {
      onMutate() {
        LoadingSonner({ message: "Updating randomization settings..." });
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Success",
          message: "Randomization settings updated successfully!",
        });
      },
      onError(error) {
        ErrorSonner({
          header: "Error",
          message: "Failed to update randomization settings. Please try again.",
        });
      },
    },
  });

  // Update Monitored Tokens
  const {
    writeContract: updateTokens,
    isPending: isUpdatingTokens,
    error: tokensError,
    isSuccess: tokensSuccess,
  } = useWriteContract({
    mutation: {
      onMutate() {
        LoadingSonner({ message: "Updating monitored tokens..." });
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Success",
          message: "Monitored tokens updated successfully!",
        });
      },
      onError(error) {
        ErrorSonner({
          header: "Error",
          message: "Failed to update monitored tokens. Please try again.",
        });
      },
    },
  });

  // Helper functions
  const updateFallbackWallet = useCallback(
    (newFallback: Address) => {
      if (!walletAddress || !address) return;
      updateFallback({
        address: walletAddress,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "updateFallbackWallet",
        args: [newFallback],
        account: address,
        chain,
      });
    },
    [walletAddress, updateFallback, address, chain]
  );

  const updateWalletPriority = useCallback(
    (wallet: Address, newPriority: bigint) => {
      if (!walletAddress || !address) return;
      updatePriority({
        address: walletAddress,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "updateWalletPriority",
        args: [wallet, newPriority],
        account: address,
        chain,
      });
    },
    [walletAddress, updatePriority, address, chain]
  );

  const setRandomizationEnabled = useCallback(
    (enabled: boolean) => {
      if (!walletAddress || !address) return;
      updateRandomization({
        address: walletAddress,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "updateRandomization",
        args: [enabled],
        account: address,
        chain,
      });
    },
    [walletAddress, updateRandomization, address, chain]
  );

  const setMonitoredTokens = useCallback(
    (tokenAddresses: Address[], tokenTypes: number[]) => {
      if (!walletAddress || !address) return;
      updateTokens({
        address: walletAddress,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "updateMonitoredTokens",
        args: [tokenAddresses, tokenTypes],
        account: address,
        chain,
      });
    },
    [walletAddress, updateTokens, address, chain]
  );

  return {
    // Fallback wallet operations
    updateFallbackWallet,
    isUpdatingFallback,
    fallbackError,
    fallbackSuccess,

    // Wallet priority operations
    updateWalletPriority,
    isUpdatingPriority,
    priorityError,
    prioritySuccess,

    // Randomization operations
    setRandomizationEnabled,
    isUpdatingRandomization,
    randomizationError,
    randomizationSuccess,

    // Monitored tokens operations
    setMonitoredTokens,
    isUpdatingTokens,
    tokensError,
    tokensSuccess,
  };
};
