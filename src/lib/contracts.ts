import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  type Log,
} from "viem";
import {
  ROLLBACK_MANAGER_ABI,
  ROLLBACK_WALLET_ABI,
  ERC20_ABI,
  ERC721_ABI,
  TOKEN_TYPE,
  VOTE_TYPE,
} from "@/config/contracts";
import { config, getContractAddress } from "@/config/env";
import type { CreateWalletFormData } from "@/types/api";
import { encryptPrivateKey } from "@/lib/encryption";

// Helper function to get contract address for a specific chain
const getRollbackManagerAddress = (chainId: number): Address => {
  const targetChainId = chainId || config.defaultChainId;
  return getContractAddress(targetChainId) as Address;
};

// Types for creation request
export interface CreationRequest {
  requestId: number;
  params: {
    user: string;
    wallets: string[];
    threshold: number;
    tokensToMonitor: string[];
    tokenTypes: number[];
    isRandomized: boolean;
    fallbackWallet: string;
    agentWallet: string;
  };
  signers: string[];
  executed: boolean;
  signatureCount: number;
}

// Check if user has a rollback wallet
export const checkRollbackWallet = async (
  publicClient: PublicClient,
  userAddress: Address,
  chainId?: number
): Promise<{ hasWallet: boolean; walletAddress: string }> => {
  try {
    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const result = await publicClient.readContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "hasRollbackWallet",
      args: [userAddress],
    });

    const [hasWallet, walletAddress] = result as [boolean, Address];

    return {
      hasWallet,
      walletAddress:
        walletAddress || "0x0000000000000000000000000000000000000000",
    };
  } catch (error) {
    console.error("Error checking rollback wallet:", error);
    return {
      hasWallet: false,
      walletAddress: "0x0000000000000000000000000000000000000000",
    };
  }
};

// Check for pending creation requests for a user
export const checkPendingCreationRequests = async (
  publicClient: PublicClient,
  userAddress: Address,
  chainId?: number
): Promise<CreationRequest[]> => {
  try {
    // Get all creation requests

    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    console.log({ rollbackManagerAddress, chainId });
    const result = await publicClient.readContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getAllCreationRequests",
    });

    const [requestIds, requests] = result as [bigint[], any[]];

    // Filter for pending requests where user is involved
    const pendingRequests: CreationRequest[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (
        !request.executed &&
        request.params.walletList.includes(userAddress)
      ) {
        pendingRequests.push({
          requestId: Number(requestIds[i]),
          params: {
            user: request.params.userAddress,
            wallets: request.params.walletList,
            threshold: Number(request.params.timeThreshold),
            tokensToMonitor: request.params.tokensToMonitor,
            tokenTypes: request.params.tokenTypes,
            isRandomized: request.params.isRandomized,
            fallbackWallet: request.params.fallbackWallet,
            agentWallet: request.params.agentWallet,
          },
          signers: request.signers,
          executed: request.executed,
          signatureCount: Number(request.signatureCount),
        });
      }
    }

    return pendingRequests;
  } catch (error) {
    console.error("Error checking pending creation requests:", error);
    return [];
  }
};

// Step 1: Propose wallet creation (returns requestId)
export const proposeWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: CreateWalletFormData,
  chainId: number
): Promise<number> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  // Convert token types to contract format
  const tokenTypes = params.tokensToMonitor.map((token) =>
    token.type === "ERC20" ? TOKEN_TYPE.ERC20 : TOKEN_TYPE.ERC721
  );

  const contractParams = {
    userAddress: params.wallets[0] as Address,
    walletList: params.wallets as Address[],
    timeThreshold: BigInt(params.threshold),
    tokensToMonitor: params.tokensToMonitor.map((t) => t.address as Address),
    tokenTypes: tokenTypes,
    isRandomized: params.isRandomized,
    fallbackWallet: (params.fallbackWallet ||
      "0x0000000000000000000000000000000000000000") as Address,
    agentWallet: (params.agentWallet ||
      "0x0000000000000000000000000000000000000000") as Address,
  };

  try {
    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const { request } = await publicClient.simulateContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "proposeWalletCreation",
      args: [contractParams],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    // Wait for transaction and get receipt to extract requestId from events
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // TODO: Parse logs to get the requestId from WalletCreationProposed event
    // For now, return a timestamp-based requestId as a temporary solution
    // In production, extract from the actual event logs
    const tempRequestId = Date.now() % 1000000; // Simple mock requestId

    return tempRequestId;
  } catch (error) {
    console.error("Error proposing wallet creation:", error);
    throw new Error("Failed to propose wallet creation");
  }
};

// Step 2: Sign wallet creation request
export const signWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  requestId: number,
  chainId: number
): Promise<void> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const { request } = await publicClient.simulateContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "signWalletCreation",
      args: [BigInt(requestId)],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    console.error("Error signing wallet creation:", error);
    throw new Error("Failed to sign wallet creation");
  }
};

// Step 3: Finalize wallet creation with payment
export const finalizeWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  requestId: number,
  chainId: number
): Promise<string> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    // Get the initialization fee
    const fee = await getInitializationFee(publicClient, chainId);

    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const { request } = await publicClient.simulateContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "finalizeWalletCreation",
      args: [BigInt(requestId)],
      account: walletClient.account.address,
      value: BigInt(fee),
    });

    const hash = await walletClient.writeContract(request);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Wait a bit for the contract state to update
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Use findRollbackWalletForAddress for accurate wallet data (equivalent to useSimpleFindRollbackWallet)
    try {
      const walletResult = await findRollbackWalletForAddress(
        publicClient,
        walletClient.account.address,
        chainId
      );

      if (walletResult.hasWallet && walletResult.walletAddress) {
        return walletResult.walletAddress;
      } else {
        // If no wallet found, verify the creation request was executed
        const creationRequest = await getCreationRequest(
          publicClient,
          requestId,
          chainId
        );
        if (creationRequest.executed) {
          return "WALLET_CREATED_PENDING"; // Special value to indicate success but address pending
        }
      }
    } catch (readError) {
      console.warn(
        "Could not get accurate wallet data immediately after creation:",
        readError
      );
      // Return pending status - the hooks will provide accurate data
      return "WALLET_CREATED_PENDING"; // Special value to indicate success but address pending
    }

    throw new Error(
      "Wallet creation may have failed - please check transaction"
    );
  } catch (error) {
    console.error("Error finalizing wallet creation:", error);
    throw new Error("Failed to finalize wallet creation");
  }
};

// Get initialization fee from contract
export const getInitializationFee = async (
  publicClient: PublicClient,
  chainId?: number
): Promise<string> => {
  try {
    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const fee = await publicClient.readContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getInitializationFee",
    });

    return (fee as bigint).toString();
  } catch (error) {
    console.error("Error getting initialization fee:", error);
  }
};

// Get creation request details
export const getCreationRequest = async (
  publicClient: PublicClient,
  requestId: number,
  chainId?: number
): Promise<CreationRequest> => {
  try {
    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const request = await publicClient.readContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getCreationRequest",
      args: [BigInt(requestId)],
    });

    const typedRequest = request as any;
    return {
      requestId: Number(typedRequest.requestId),
      params: {
        user: typedRequest.params.userAddress,
        wallets: typedRequest.params.walletList,
        threshold: Number(typedRequest.params.timeThreshold),
        tokensToMonitor: typedRequest.params.tokensToMonitor,
        tokenTypes: typedRequest.params.tokenTypes,
        isRandomized: typedRequest.params.isRandomized,
        fallbackWallet: typedRequest.params.fallbackWallet,
        agentWallet: typedRequest.params.agentWallet,
      },
      signers: typedRequest.signers,
      executed: typedRequest.executed,
      signatureCount: Number(typedRequest.signatureCount),
    };
  } catch (error) {
    console.error("Error getting creation request:", error);
    throw new Error("Failed to get creation request");
  }
};

// VOTING FUNCTIONS

// Request a vote (agent change, threshold change, obsolete wallet)
export const requestVote = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  walletAddress: Address,
  voteType: "AGENT_CHANGE" | "THRESHOLD_CHANGE" | "OBSOLETE_WALLET",
  targetAddress?: Address,
  targetValue?: number
): Promise<void> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  const voteTypeEnum = VOTE_TYPE[voteType];
  const target = targetAddress || "0x0000000000000000000000000000000000000000";
  const value = targetValue ? BigInt(targetValue) : BigInt(0);

  try {
    const { request } = await publicClient.simulateContract({
      address: walletAddress,
      abi: ROLLBACK_WALLET_ABI,
      functionName: "requestVote",
      args: [voteTypeEnum, target, value],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    console.error("Error requesting vote:", error);
    throw new Error("Failed to request vote");
  }
};

// Confirm a vote
export const confirmVote = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  walletAddress: Address,
  voteId: number,
  approve: boolean
): Promise<void> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: walletAddress,
      abi: ROLLBACK_WALLET_ABI,
      functionName: "confirmVote",
      args: [BigInt(voteId), approve],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    console.error("Error confirming vote:", error);
    throw new Error("Failed to confirm vote");
  }
};

// Get all votes for a wallet
export const getAllVotes = async (
  publicClient: PublicClient,
  walletAddress: Address
) => {
  try {
    const votes = await publicClient.readContract({
      address: walletAddress,
      abi: ROLLBACK_WALLET_ABI,
      functionName: "getAllVotes",
    });

    return votes;
  } catch (error) {
    console.error("Error getting votes:", error);
    return [];
  }
};

// TOKEN APPROVAL FUNCTIONS

// Check ERC20 token approval status
export const checkERC20Approval = async (
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<{ isApproved: boolean; allowance: string }> => {
  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });

    const allowanceString = (allowance as bigint).toString();
    const isApproved = BigInt(allowanceString) > BigInt(0);

    return {
      isApproved,
      allowance: allowanceString,
    };
  } catch (error) {
    console.error("Error checking ERC20 approval:", error);
    return {
      isApproved: false,
      allowance: "0",
    };
  }
};

// Check ERC721 token approval status
export const checkERC721Approval = async (
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address,
  operatorAddress: Address
): Promise<{ isApproved: boolean }> => {
  try {
    const isApproved = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC721_ABI,
      functionName: "isApprovedForAll",
      args: [ownerAddress, operatorAddress],
    });

    return {
      isApproved: isApproved as boolean,
    };
  } catch (error) {
    console.error("Error checking ERC721 approval:", error);
    return {
      isApproved: false,
    };
  }
};

// Get ERC20 token balance
export const getERC20Balance = async (
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address
): Promise<{ balance: string; decimals: number }> => {
  try {
    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [ownerAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      balance: (balance as bigint).toString(),
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error("Error getting ERC20 balance:", error);
    return {
      balance: "0",
      decimals: 18, // Default decimals
    };
  }
};

// Get ERC721 token balance (number of tokens owned)
export const getERC721Balance = async (
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address
): Promise<{ balance: string }> => {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC721_ABI,
      functionName: "balanceOf",
      args: [ownerAddress],
    });

    return {
      balance: (balance as bigint).toString(),
    };
  } catch (error) {
    console.error("Error getting ERC721 balance:", error);
    return {
      balance: "0",
    };
  }
};

// Get wallet information from contract
export const getWalletInfoFromContract = async (
  publicClient: PublicClient,
  userAddress: Address,
  chainId: number
): Promise<{
  hasWallet: boolean;
  walletAddress: string;
  walletInfo?: {
    threshold: number;
    isRandomized: boolean;
    fallbackWallet: string;
    agentWallet: string;
    treasuryAddress: string;
    wallets: Array<{
      walletAddress: string;
      lastActivity: number;
      priorityPosition: number;
      isObsolete: boolean;
      nextWalletInLine: string;
    }>;
    monitoredTokens: Array<{
      tokenAddress: string;
      tokenType: number;
      isActive: boolean;
    }>;
  };
}> => {
  try {
    // First check if user has a wallet
    const { hasWallet, walletAddress } = await checkRollbackWallet(
      publicClient,
      userAddress,
      chainId
    );

    if (
      !hasWallet ||
      walletAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return { hasWallet: false, walletAddress: "" };
    }

    // Get detailed wallet information
    const [systemConfig, allWallets, monitoredTokens] = await Promise.all([
      publicClient.readContract({
        address: walletAddress as Address,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "getSystemConfig",
      }),
      publicClient.readContract({
        address: walletAddress as Address,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "getAllWallets",
      }),
      publicClient.readContract({
        address: walletAddress as Address,
        abi: ROLLBACK_WALLET_ABI,
        functionName: "getMonitoredTokens",
      }),
    ]);

    const [
      threshold,
      isRandomized,
      fallbackWallet,
      agentWallet,
      treasuryAddress,
    ] = systemConfig as [bigint, boolean, string, string, string];

    // Handle monitored tokens - this returns [tokens[], types[]]
    const [tokenAddresses, tokenTypes] = monitoredTokens as [
      string[],
      number[]
    ];
    const formattedTokens = tokenAddresses.map((address, index) => ({
      tokenAddress: address,
      tokenType: tokenTypes[index] || 0,
      isActive: true,
    }));

    // Format wallets array
    const formattedWallets = (allWallets as any[]).map((wallet) => ({
      walletAddress: wallet.walletAddress,
      lastActivity: Number(wallet.lastActivity),
      priorityPosition: Number(wallet.priorityPosition),
      isObsolete: wallet.isObsolete,
      nextWalletInLine: wallet.nextWalletInLine,
    }));

    return {
      hasWallet: true,
      walletAddress,
      walletInfo: {
        threshold: Math.floor(Number(threshold) / 86400), // Convert seconds to days
        isRandomized,
        fallbackWallet,
        agentWallet,
        treasuryAddress,
        wallets: formattedWallets,
        monitoredTokens: formattedTokens,
      },
    };
  } catch (error) {
    console.error("Error getting wallet info from contract:", error);
    return { hasWallet: false, walletAddress: "" };
  }
};

export const approveERC20Token = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenAddress: Address,
  spenderAddress: Address,
  amount?: string
): Promise<void> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  const approvalAmount = amount
    ? BigInt(amount)
    : BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      ); // Max approval

  try {
    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress, approvalAmount],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    console.error("Error approving ERC20 token:", error);
    throw new Error("Failed to approve ERC20 token");
  }
};

export const approveERC721Token = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenAddress: Address,
  operatorAddress: Address,
  approved: boolean = true
): Promise<void> => {
  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: tokenAddress,
      abi: ERC721_ABI,
      functionName: "setApprovalForAll",
      args: [operatorAddress, approved],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);

    await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    console.error("Error approving ERC721 token:", error);
    throw new Error("Failed to approve ERC721 token");
  }
};

// Helper function to generate agent wallet (placeholder for real implementation)
export const generateRandomWallet = () => {
  // TODO: Replace with secure key generation and proper backend integration
  throw new Error(
    "Agent wallet generation not yet implemented - requires secure backend integration"
  );
};

// Export types for other files
export type { Address, PublicClient, WalletClient };

// Update backend with wallet creation data
export const updateBackendWithWalletData = async (walletData: {
  userAddress: string;
  rollbackWalletAddress: string;
  agentWalletAddress: string;
  agentWalletPrivateKey: string;
  wallets: string[];
  threshold: number;
  isRandomized: boolean;
  fallbackWallet: string;
  email: string;
  tokensToMonitor: Array<{
    address: string;
    type: "ERC20" | "ERC721";
    symbol?: string;
    name?: string;
  }>;
}) => {
  try {
    // Encrypt the private key on frontend before sending to backend

    const encryptedPrivateKey = await encryptPrivateKey(
      walletData.agentWalletPrivateKey
    );

    // Format data for backend API according to test-rollback-api.js structure
    const backendPayload = {
      user_address: walletData.userAddress,
      wallet_addresses: walletData.wallets,
      email: walletData.email,
      rollback_config: {
        inactivity_threshold: Math.floor(walletData.threshold / 86400), // Convert seconds to days
        rollback_method: walletData.isRandomized ? "random" : "priority", // "random" not "randomized"
        fallback_wallet: walletData.fallbackWallet,
        agent_wallet: walletData.agentWalletAddress,
        rollback_wallet_address: walletData.rollbackWalletAddress,
        tokens_to_monitor: walletData.tokensToMonitor.map((token) => ({
          address: token.address,
          type: token.type,
          // Only address and type as per test-rollback-api.js
        })),
      },
      agent_wallet_private_key: encryptedPrivateKey, // Top-level, encrypted
    };

    // Create user in backend
    const userResponse = await fetch(`${config.apiUrl}/wallets/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();

      throw new Error(
        `Backend API error: ${userResponse.status} - ${errorText}`
      );
    }

    const responseData = await userResponse.json();

    return {
      success: true,
      userId: responseData.user?.id || responseData.id,
      message: "User data stored in backend for monitoring",
    };
  } catch (error) {
    throw new Error(
      `Failed to store wallet data in backend: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Enhanced function to find rollback wallet for any connected address (even if not primary owner)
export const findRollbackWalletForAddress = async (
  publicClient: PublicClient,
  userAddress: Address,
  chainId: number
): Promise<{
  hasWallet: boolean;
  walletAddress: string;
  walletInfo?: {
    threshold: number;
    isRandomized: boolean;
    fallbackWallet: string;
    agentWallet: string;
    treasuryAddress: string;
    wallets: Array<{
      walletAddress: string;
      lastActivity: number;
      priorityPosition: number;
      isObsolete: boolean;
      nextWalletInLine: string;
    }>;
    monitoredTokens: Array<{
      tokenAddress: string;
      tokenType: number;
      isActive: boolean;
    }>;
  };
  userRole?: "owner" | "recovery_wallet";
}> => {
  try {
    // First, try the direct approach - check if user is the primary owner
    const directResult = await getWalletInfoFromContract(
      publicClient,
      userAddress,
      chainId
    );
    if (directResult.hasWallet) {
      return {
        ...directResult,
        userRole: "owner",
      };
    }

    // If not found as primary owner, check executed creation requests in the manager

    const rollbackManagerAddress = getRollbackManagerAddress(chainId);
    const allRequests = await publicClient.readContract({
      address: rollbackManagerAddress,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getAllCreationRequests",
    });

    const [requestIds, requests] = allRequests as [bigint[], any[]];

    // Filter to only executed requests for efficiency
    const executedRequests = requests.filter((request) => request.executed);

    // Check each executed request to see if userAddress is in the wallets array
    for (const request of executedRequests) {
      try {
        // Check if the userAddress is in the wallets array OR is the primary user
        const isInWallets = request.params.walletList.some(
          (wallet: string) => wallet.toLowerCase() === userAddress.toLowerCase()
        );
        const isPrimaryUser =
          request.params.userAddress.toLowerCase() ===
          userAddress.toLowerCase();

        if (isInWallets || isPrimaryUser) {
          // Get the rollback wallet address for this primary user
          const rollbackWalletAddress = await publicClient.readContract({
            address: rollbackManagerAddress,
            abi: ROLLBACK_MANAGER_ABI,
            functionName: "getUserWallet",
            args: [request.params.userAddress as Address],
          });

          const walletAddressString = rollbackWalletAddress as string;

          if (
            walletAddressString &&
            walletAddressString !== "0x0000000000000000000000000000000000000000"
          ) {
            // Get detailed wallet information
            const [systemConfig, allWallets, monitoredTokens] =
              await Promise.all([
                publicClient.readContract({
                  address: walletAddressString as Address,
                  abi: ROLLBACK_WALLET_ABI,
                  functionName: "getSystemConfig",
                }),
                publicClient.readContract({
                  address: walletAddressString as Address,
                  abi: ROLLBACK_WALLET_ABI,
                  functionName: "getAllWallets",
                }),
                publicClient.readContract({
                  address: walletAddressString as Address,
                  abi: ROLLBACK_WALLET_ABI,
                  functionName: "getMonitoredTokens",
                }),
              ]);

            const [
              threshold,
              isRandomized,
              fallbackWallet,
              agentWallet,
              treasuryAddress,
            ] = systemConfig as [bigint, boolean, string, string, string];

            // Handle monitored tokens
            const [tokenAddresses, tokenTypes] = monitoredTokens as [
              string[],
              number[]
            ];
            const formattedTokens = tokenAddresses.map((address, index) => ({
              tokenAddress: address,
              tokenType: tokenTypes[index] || 0,
              isActive: true,
            }));

            // Format wallets array
            const formattedWallets = (allWallets as any[]).map((wallet) => ({
              walletAddress: wallet.walletAddress,
              lastActivity: Number(wallet.lastActivity),
              priorityPosition: Number(wallet.priorityPosition),
              isObsolete: wallet.isObsolete,
              nextWalletInLine: wallet.nextWalletInLine,
            }));

            return {
              hasWallet: true,
              walletAddress: walletAddressString,
              walletInfo: {
                threshold: Math.floor(Number(threshold) / 86400), // Convert seconds to days
                isRandomized,
                fallbackWallet,
                agentWallet,
                treasuryAddress,
                wallets: formattedWallets,
                monitoredTokens: formattedTokens,
              },
              userRole: isPrimaryUser ? "owner" : "recovery_wallet",
            };
          }
        }
      } catch (walletError) {
        console.warn(
          "⚠️ Could not get wallet details for user:",
          request.params.userAddress,
          walletError
        );
        continue;
      }
    }

    return { hasWallet: false, walletAddress: "" };
  } catch (error) {
    console.error("❌ Error checking RollbackWalletManager:", error);
    return { hasWallet: false, walletAddress: "" };
  }
};
