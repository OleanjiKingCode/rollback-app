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

/**
 * Hook for requesting votes in rollback wallet
 */
export const useWriteRequestVote = (
  walletAddress?: Address,
  voteType?: "AGENT_CHANGE" | "THRESHOLD_CHANGE" | "OBSOLETE_WALLET",
  targetAddress?: Address,
  targetValue?: number
) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  const [enabled, setEnabled] = useState(false);
  const [errorException, setErrorException] = useState<Error>();
  const toastIdRef = useRef<string | number>();
  const newFetchRef = useRef(false);

  const voteTypeEnum = voteType ? VOTE_TYPE[voteType] : undefined;
  const target = targetAddress || "0x0000000000000000000000000000000000000000";
  const value = targetValue ? BigInt(targetValue) : BigInt(0);

  const {
    data: simData,
    status: simStatus,
    error: simError,
    fetchStatus: simFetchStatus,
  } = useSimulateContract({
    address: walletAddress,
    abi: ROLLBACK_WALLET_ABI,
    functionName: "requestVote",
    args:
      voteTypeEnum !== undefined ? [voteTypeEnum, target, value] : undefined,
    query: {
      enabled: enabled && !!walletAddress && voteTypeEnum !== undefined,
    },
  });

  const {
    writeContract: requestVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `Requesting ${voteType?.replace("_", " ")} Vote`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Vote Request",
          message: `${voteType?.replace("_", " ")} vote requested successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
      onError() {
        ErrorSonner({
          header: "Vote Request Error",
          message: `Failed to request ${voteType?.replace("_", " ")} vote`,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
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
      requestVote(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, requestVote]);

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
    }
  }, [writeStatus, writeReset]);

  useEffect(() => {
    if (errorException !== undefined) {
      console.error("Sentry capture:", errorException);
      // TODO: Add Sentry.captureException(errorException);
    }
  }, [errorException]);

  return {
    requestVote: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for confirming votes in rollback wallet
 */
export const useWriteConfirmVote = (
  walletAddress?: Address,
  voteId?: number,
  approve?: boolean
) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  const [enabled, setEnabled] = useState(false);
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
    args:
      voteId !== undefined && approve !== undefined
        ? [BigInt(voteId), approve]
        : undefined,
    query: {
      enabled:
        enabled &&
        !!walletAddress &&
        voteId !== undefined &&
        approve !== undefined,
    },
  });

  const {
    writeContract: confirmVote,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `${approve ? "Approving" : "Rejecting"} Vote`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Vote Confirmation",
          message: `Vote ${approve ? "approved" : "rejected"} successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
      onError() {
        ErrorSonner({
          header: "Vote Confirmation Error",
          message: `Failed to ${approve ? "approve" : "reject"} vote`,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
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
      confirmVote(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, confirmVote]);

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
    }
  }, [writeStatus, writeReset]);

  useEffect(() => {
    if (errorException !== undefined) {
      console.error("Sentry capture:", errorException);
    }
  }, [errorException]);

  return {
    confirmVote: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Composite hook for complete vote management
 */
export const useVoteManagement = (walletAddress?: Address) => {
  // Individual hooks for different vote operations
  const agentChangeVote = useWriteRequestVote(walletAddress, "AGENT_CHANGE");
  const thresholdChangeVote = useWriteRequestVote(
    walletAddress,
    "THRESHOLD_CHANGE"
  );
  const obsoleteWalletVote = useWriteRequestVote(
    walletAddress,
    "OBSOLETE_WALLET"
  );
  const confirmVoteHook = useWriteConfirmVote(walletAddress);

  return {
    // Vote request functions
    requestAgentChange: agentChangeVote.requestVote,
    requestThresholdChange: thresholdChangeVote.requestVote,
    requestObsoleteWallet: obsoleteWalletVote.requestVote,

    // Vote confirmation function
    confirmVote: confirmVoteHook.confirmVote,

    // Loading states
    isRequestingVote:
      agentChangeVote.isLoading ||
      thresholdChangeVote.isLoading ||
      obsoleteWalletVote.isLoading,
    isConfirmingVote: confirmVoteHook.isLoading,

    // Error states
    voteRequestError:
      agentChangeVote.error ||
      thresholdChangeVote.error ||
      obsoleteWalletVote.error,
    voteConfirmError: confirmVoteHook.error,

    // Status tracking
    voteRequestStatus: {
      agentChange: agentChangeVote.status,
      thresholdChange: thresholdChangeVote.status,
      obsoleteWallet: obsoleteWalletVote.status,
    },
    voteConfirmStatus: confirmVoteHook.status,

    // Transaction data
    voteRequestData: {
      agentChange: agentChangeVote.data,
      thresholdChange: thresholdChangeVote.data,
      obsoleteWallet: obsoleteWalletVote.data,
    },
    voteConfirmData: confirmVoteHook.data,
  };
};
