import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSimulateContract, useWriteContract, useAccount } from "wagmi";
import { type Address, type BaseError, parseEther } from "viem";
import {
  ROLLBACK_MANAGER_ABI,
  ROLLBACK_WALLET_ABI,
  ERC20_ABI,
  ERC721_ABI,
  TOKEN_TYPE,
  VOTE_TYPE,
} from "@/config/contracts";
import { config } from "@/config/env";
import { toastApi, sonnerToasts } from "@/lib/toast";
import type { CreateWalletFormData } from "@/types/api";

const ROLLBACK_MANAGER_ADDRESS = config.rollbackManagerAddress as Address;

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
 * Hook for proposing wallet creation
 */
export const useWriteProposeWalletCreation = (
  params?: CreateWalletFormData
) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  // State management
  const [enabled, setEnabled] = useState(false);
  const [errorException, setErrorException] = useState<Error>();
  const toastIdRef = useRef<string | number>();
  const newFetchRef = useRef(false);

  // Convert params to contract format
  const contractParams = params
    ? {
        user: params.wallets[0] as Address,
        wallets: params.wallets as Address[],
        threshold: BigInt(params.threshold),
        tokensToMonitor: params.tokensToMonitor.map(
          (t) => t.address as Address
        ),
        tokenTypes: params.tokensToMonitor.map((token) =>
          token.type === "ERC20" ? TOKEN_TYPE.ERC20 : TOKEN_TYPE.ERC721
        ),
        isRandomized: params.isRandomized,
        fallbackWallet: (params.fallbackWallet ||
          "0x0000000000000000000000000000000000000000") as Address,
        agentWallet: (params.agentWallet ||
          "0x0000000000000000000000000000000000000000") as Address,
      }
    : undefined;

  // Simulation hook
  const {
    data: simData,
    status: simStatus,
    error: simError,
    fetchStatus: simFetchStatus,
  } = useSimulateContract({
    address: ROLLBACK_MANAGER_ADDRESS,
    abi: ROLLBACK_MANAGER_ABI,
    functionName: "proposeWalletCreation",
    args: contractParams ? [contractParams] : undefined,
    query: {
      enabled: enabled && !!contractParams,
    },
  });

  // Write hook
  const {
    writeContract: proposeWallet,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `Creating Rollback Wallet Proposal`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Wallet Creation",
          message: `Proposal submitted successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
      onError() {
        ErrorSonner({
          header: "Wallet Creation Error",
          message: `Failed to submit proposal`,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
    },
  });

  // Track fetch status
  useEffect(() => {
    if (simFetchStatus === "fetching") {
      newFetchRef.current = true;
    }
  }, [simFetchStatus]);

  // Execute when simulation succeeds
  useEffect(() => {
    if (
      newFetchRef.current &&
      enabled &&
      simStatus === "success" &&
      simData?.request
    ) {
      proposeWallet(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, proposeWallet]);

  // Handle simulation errors
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

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setErrorException(
        new CustomError(
          "Propose Wallet Creation Error",
          writeError.message,
          address,
          writeError
        )
      );
    }
  }, [writeError, address]);

  // Reset on error
  useEffect(() => {
    if (writeStatus === "error") {
      writeReset();
    }
  }, [writeStatus, writeReset]);

  // Error tracking
  useEffect(() => {
    if (errorException !== undefined) {
      // TODO: Add error tracking
    }
  }, [errorException]);

  return {
    proposeWallet: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for signing wallet creation
 */
export const useWriteSignWalletCreation = (requestId?: number) => {
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
    address: ROLLBACK_MANAGER_ADDRESS,
    abi: ROLLBACK_MANAGER_ABI,
    functionName: "signWalletCreation",
    args: requestId !== undefined ? [BigInt(requestId)] : undefined,
    query: {
      enabled: enabled && requestId !== undefined,
    },
  });

  const {
    writeContract: signWallet,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `Signing Wallet Creation`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Wallet Signature",
          message: `Signature submitted successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
      onError() {
        ErrorSonner({
          header: "Signature Error",
          message: `Failed to submit signature`,
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
      signWallet(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, signWallet]);

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
          "Sign Wallet Creation Error",
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
      // TODO: Add error tracking
    }
  }, [errorException]);

  return {
    signWallet: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for finalizing wallet creation
 */
export const useWriteFinalizeWalletCreation = (
  requestId?: number,
  fee?: string
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
    address: ROLLBACK_MANAGER_ADDRESS,
    abi: ROLLBACK_MANAGER_ABI,
    functionName: "finalizeWalletCreation",
    args: requestId !== undefined ? [BigInt(requestId)] : undefined,
    value: fee ? BigInt(fee) : undefined,
    query: {
      enabled: enabled && requestId !== undefined && fee !== undefined,
    },
  });

  const {
    writeContract: finalizeWallet,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `Finalizing Wallet Creation`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "Wallet Created",
          message: `Rollback wallet created successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);
      },
      onError() {
        ErrorSonner({
          header: "Creation Error",
          message: `Failed to create wallet`,
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
      finalizeWallet(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, finalizeWallet]);

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
          "Finalize Wallet Creation Error",
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
      // TODO: Add error tracking
    }
  }, [errorException]);

  return {
    finalizeWallet: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for ERC20 token approval
 */
export const useWriteApproveERC20 = (
  tokenAddress?: Address,
  spenderAddress?: Address,
  amount?: string,
  onSuccess?: () => void
) => {
  const { address } = useAccount();
  const { ErrorSonner, LoadingSonner, SuccessfulSonner } = sonnerToasts();

  const [enabled, setEnabled] = useState(false);
  const [errorException, setErrorException] = useState<Error>();
  const toastIdRef = useRef<string | number>();
  const newFetchRef = useRef(false);

  const isRevoking = amount === "0";

  const approvalAmount = useMemo(() => {
    if (!amount) {
      return undefined;
    }

    return parseEther(amount);
  }, [amount]);

  const {
    data: simData,
    status: simStatus,
    error: simError,
    fetchStatus: simFetchStatus,
  } = useSimulateContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: spenderAddress ? [spenderAddress, approvalAmount] : undefined,
    query: {
      enabled:
        enabled &&
        !!tokenAddress &&
        !!spenderAddress &&
        approvalAmount !== undefined,
    },
  });

  const {
    writeContract: approveToken,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `${isRevoking ? "Revoking" : "Approving"} Token`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: `Token ${isRevoking ? "Revoked" : "Approved"}`,
          message: `Token ${isRevoking ? "revocation" : "approval"} successful`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);

        // Trigger refetch of allowance data
        if (onSuccess) {
          // Small delay to ensure blockchain state is updated
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      },
      onError() {
        ErrorSonner({
          header: `${isRevoking ? "Revoke" : "Approval"} Error`,
          message: `Failed to ${isRevoking ? "revoke" : "approve"} token`,
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
      approveToken(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, approveToken]);

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
          "ERC20 Approval Error",
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
      // TODO: Add error tracking
    }
  }, [errorException]);

  return {
    approveToken: useCallback(() => {
      // Check if amount is provided
      if (!amount) {
        ErrorSonner({
          header: "Amount Required",
          message: "Please specify an approval amount before proceeding",
        });
        return;
      }
      setEnabled(true);
    }, [amount]),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    simFetchStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};

/**
 * Hook for ERC721 token approval
 */
export const useWriteApproveERC721 = (
  tokenAddress?: Address,
  operatorAddress?: Address,
  approved = true,
  onSuccess?: () => void
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
    address: tokenAddress,
    abi: ERC721_ABI,
    functionName: "setApprovalForAll",
    args: operatorAddress ? [operatorAddress, approved] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!operatorAddress,
    },
  });

  const {
    writeContract: approveNFT,
    data: writeData,
    error: writeError,
    status: writeStatus,
    reset: writeReset,
  } = useWriteContract({
    mutation: {
      onMutate() {
        const toastId = LoadingSonner({
          message: `${approved ? "Approving" : "Revoking"} NFT`,
        });
        if (toastId !== toastIdRef.current) {
          toastApi.dismiss(toastIdRef.current);
          toastIdRef.current = toastId;
        }
        setEnabled(false);
      },
      onSuccess() {
        SuccessfulSonner({
          header: "NFT Approval",
          message: `NFT ${approved ? "approved" : "revoked"} successfully`,
          duration: 3000,
          toastProps: {
            id: toastIdRef.current,
          },
        });
        setEnabled(false);

        // Trigger refetch of allowance data
        if (onSuccess) {
          // Small delay to ensure blockchain state is updated
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      },
      onError() {
        ErrorSonner({
          header: "NFT Approval Error",
          message: `Failed to ${approved ? "approve" : "revoke"} NFT`,
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
      approveNFT(simData.request);
      newFetchRef.current = false;
    }
  }, [simStatus, simData, enabled, approveNFT]);

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
          "ERC721 Approval Error",
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
      // TODO: Add error tracking
    }
  }, [errorException]);

  return {
    approveNFT: useCallback(() => setEnabled(true), []),
    data: writeData,
    error: writeError,
    status: writeStatus,
    simStatus,
    simFetchStatus,
    isLoading: writeStatus === "pending" || simFetchStatus === "fetching",
    setEnabled,
  };
};
