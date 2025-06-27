import { type Address, type PublicClient, type WalletClient } from "viem";
import {
  ROLLBACK_MANAGER_ABI,
  ROLLBACK_WALLET_ABI,
  ERC20_ABI,
  ERC721_ABI,
  TOKEN_TYPE,
  VOTE_TYPE,
} from "@/config/contracts";
import type { CreateWalletFormData } from "@/types/api";

// Contract addresses on Base Sepolia
const ROLLBACK_MANAGER_ADDRESS =
  "0xbA429E21610fDFc09737a438898Dd31b0412c110" as Address;

// Check if user has a rollback wallet
export const checkRollbackWallet = async (
  publicClient: PublicClient,
  userAddress: Address
): Promise<{ hasWallet: boolean; walletAddress: string }> => {
  console.log("🔍 Checking rollback wallet for:", userAddress);

  try {
    const result = await publicClient.readContract({
      address: ROLLBACK_MANAGER_ADDRESS,
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

// Step 1: Propose wallet creation (returns requestId)
export const proposeWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: CreateWalletFormData
): Promise<number> => {
  console.log("📝 Proposing wallet creation:", params);

  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  // Convert token types to contract format
  const tokenTypes = params.tokensToMonitor.map((token) =>
    token.type === "ERC20" ? TOKEN_TYPE.ERC20 : TOKEN_TYPE.ERC721
  );

  const contractParams = {
    user: params.wallets[0] as Address,
    wallets: params.wallets as Address[],
    threshold: BigInt(params.threshold),
    tokensToMonitor: params.tokensToMonitor.map((t) => t.address as Address),
    tokenTypes: tokenTypes,
    isRandomized: params.isRandomized,
    fallbackWallet: (params.fallbackWallet ||
      "0x0000000000000000000000000000000000000000") as Address,
    agentWallet: "0x0000000000000000000000000000000000000000" as Address, // TODO: Generate or get from backend
  };

  try {
    const { request } = await publicClient.simulateContract({
      address: ROLLBACK_MANAGER_ADDRESS,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "proposeWalletCreation",
      args: [contractParams],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);
    console.log("✅ Proposal transaction hash:", hash);

    // Wait for transaction and get receipt to extract requestId from events
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse logs to get the requestId from WalletCreationProposed event
    const logs = receipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === ROLLBACK_MANAGER_ADDRESS.toLowerCase()
    );

    if (logs.length > 0) {
      // For now, return a placeholder requestId - in production you'd parse the actual event data
      // The requestId would typically be extracted from the event logs using proper ABI decoding
      console.log("✅ Wallet creation proposal submitted successfully");
      return Date.now(); // Temporary placeholder until proper event parsing is implemented
    }

    throw new Error("Could not extract requestId from transaction");
  } catch (error) {
    console.error("Error proposing wallet creation:", error);
    throw new Error("Failed to propose wallet creation");
  }
};

// Step 2: Sign wallet creation request
export const signWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  requestId: number
): Promise<void> => {
  console.log("✍️ Signing wallet creation:", requestId);

  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: ROLLBACK_MANAGER_ADDRESS,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "signWalletCreation",
      args: [BigInt(requestId)],
      account: walletClient.account.address,
    });

    const hash = await walletClient.writeContract(request);
    console.log("✅ Signature transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Wallet creation signed successfully");
  } catch (error) {
    console.error("Error signing wallet creation:", error);
    throw new Error("Failed to sign wallet creation");
  }
};

// Step 3: Finalize wallet creation with payment
export const finalizeWalletCreation = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  requestId: number
): Promise<void> => {
  console.log("🏁 Finalizing wallet creation:", requestId);

  if (!walletClient.account) {
    throw new Error("Wallet not connected");
  }

  try {
    // Get the initialization fee
    const fee = await getInitializationFee(publicClient);

    const { request } = await publicClient.simulateContract({
      address: ROLLBACK_MANAGER_ADDRESS,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "finalizeWalletCreation",
      args: [BigInt(requestId)],
      account: walletClient.account.address,
      value: BigInt(fee),
    });

    const hash = await walletClient.writeContract(request);
    console.log("✅ Finalization transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("🎉 Wallet creation finalized successfully!");
  } catch (error) {
    console.error("Error finalizing wallet creation:", error);
    throw new Error("Failed to finalize wallet creation");
  }
};

// Get initialization fee from contract
export const getInitializationFee = async (
  publicClient: PublicClient
): Promise<string> => {
  console.log("💰 Getting initialization fee");

  try {
    const fee = await publicClient.readContract({
      address: ROLLBACK_MANAGER_ADDRESS,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getInitializationFee",
    });

    return (fee as bigint).toString();
  } catch (error) {
    console.error("Error getting initialization fee:", error);
    return "2640000000000000"; // 0.00264 ETH fallback
  }
};

// Get creation request details
export const getCreationRequest = async (
  publicClient: PublicClient,
  requestId: number
) => {
  try {
    const request = await publicClient.readContract({
      address: ROLLBACK_MANAGER_ADDRESS,
      abi: ROLLBACK_MANAGER_ABI,
      functionName: "getCreationRequest",
      args: [BigInt(requestId)],
    });

    return request;
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
  console.log("🗳️ Requesting vote:", voteType, targetAddress, targetValue);

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
    console.log("✅ Vote request transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Vote requested successfully");
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
  console.log("✅ Confirming vote:", voteId, approve);

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
    console.log("✅ Vote confirmation transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Vote confirmed successfully");
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

export const approveERC20Token = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  tokenAddress: Address,
  spenderAddress: Address,
  amount?: string
): Promise<void> => {
  console.log("✅ ERC20 token approval:", tokenAddress, spenderAddress, amount);

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
    console.log("✅ ERC20 approval transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ ERC20 token approved successfully");
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
  console.log(
    "✅ ERC721 token approval:",
    tokenAddress,
    operatorAddress,
    approved
  );

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
    console.log("✅ ERC721 approval transaction hash:", hash);

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ ERC721 token approved successfully");
  } catch (error) {
    console.error("Error approving ERC721 token:", error);
    throw new Error("Failed to approve ERC721 token");
  }
};

// Helper function to generate agent wallet (placeholder for real implementation)
export const generateRandomWallet = () => {
  console.log("🤖 Agent wallet generation requested");

  // TODO: Replace with secure key generation and proper backend integration
  throw new Error(
    "Agent wallet generation not yet implemented - requires secure backend integration"
  );
};

// Export types for other files
export type { Address, PublicClient, WalletClient };
