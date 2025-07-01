"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet } from "@/hooks/useRollback";
import { useNavigate } from "react-router-dom";
import { CustomModal } from "@/components/CustomModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Clock,
  Check,
  X,
  Plus,
  User,
  Ban,
  Wallet,
  AlertTriangle,
  Loader2,
  Zap,
  Shield,
  RefreshCw,
  Unlink,
} from "lucide-react";
import {
  useGetAllVotes,
  useGetAllWallets,
} from "@/hooks/contracts/useSimpleRollbackRead";
import { useVoteManagement } from "@/hooks/contracts/useWalletOperations";
import { VOTE_TYPE } from "@/config/contracts";
import { type Address } from "viem";

type ProposalType = "agent" | "threshold" | "emergency";

interface Vote {
  voteId: number;
  voteType: number;
  targetAddress: string;
  targetValue: bigint;
  initiator: string;
  approvalsReceived: number;
  expirationTime: bigint;
  executed: boolean;
}

interface WalletInfo {
  walletAddress: string;
  isObsolete: boolean;
}

// Wallet connection check component
const WalletConnectionCheck = () => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rollback-primary/10 to-rollback-secondary/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-rollback-cream to-rollback-secondary/20 rounded-full -ml-10 -mb-10" />

            <div className="relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Unlink className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>

              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Connect your wallet to access rollback wallet settings.
              </p>

              <button
                onClick={openConnectModal}
                className="bg-gradient-to-r from-rollback-primary to-rollback-primary/90 hover:from-rollback-primary/90 hover:to-rollback-primary text-white px-4 py-2 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Connect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// No rollback wallet state component
const NoRollbackWalletState = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-rollback-dark mb-3">
            No Rollback Wallet
          </h3>
          <p className="text-gray-600 mb-8 text-xs leading-relaxed">
            You need a rollback wallet to participate in voting. Create one to
            get started with decentralized asset protection.
          </p>
          <Button
            onClick={() => navigate("/create")}
            className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-6 py-2 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Rollback Wallet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Voting() {
  const { isConnected, address } = useAccount();
  const { user, hasRollbackWallet } = useRollbackWallet();
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    type: "agent" as ProposalType,
    targetAddress: "",
    targetValue: "",
  });
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const { toast } = useToast();

  // Track which votes the user has cast locally (voteId -> true=approve, false=reject)
  const [userVotes, setUserVotes] = useState<Record<number, boolean>>({});

  // Get wallet address for contract calls
  const walletAddress = user?.rollbackConfig
    ?.rollback_wallet_address as Address;

  // Fetch all votes from contract with background refetching
  const {
    data: votesData,
    isLoading: isLoadingVotes,
    refetch: refetchVotes,
  } = useGetAllVotes(walletAddress, !!walletAddress);
  console.log({ votesData, walletAddress });

  // Mark as initially loaded once we get any response
  useEffect(() => {
    if (!hasInitiallyLoaded && (votesData !== undefined || !isLoadingVotes)) {
      setHasInitiallyLoaded(true);
    }
  }, [votesData, isLoadingVotes, hasInitiallyLoaded]);

  // Fetch wallet information for emergency rollback options
  const { data: walletsData } = useGetAllWallets(
    walletAddress,
    !!walletAddress
  );

  // Vote management hook
  const {
    requestAgentChange,
    requestThresholdChange,
    requestEmergencyRollback,
    confirmVote,
    isRequestingVote,
    isConfirmingVote,
    voteRequestStatus,
    voteRequestError,
  } = useVoteManagement(walletAddress);

  // Auto-refresh votes when transactions succeed
  useEffect(() => {
    if (voteRequestStatus === "success") {
      // Refresh votes after successful vote creation
      setTimeout(() => {
        refetchVotes();
      }, 2000);
    }
  }, [voteRequestStatus, refetchVotes]);

  // Handle modal closing based on transaction status
  useEffect(() => {
    console.log("🗳️ Vote Request Status:", {
      voteRequestStatus,
      voteRequestError: voteRequestError?.message,
      isRequestingVote,
    });

    if (voteRequestStatus === "success") {
      // Close modal and reset form on success
      setIsCreatingProposal(false);
      setNewProposal({
        type: "agent",
        targetAddress: "",
        targetValue: "",
      });
      toast({
        title: "Proposal Created",
        description: "Your vote proposal has been submitted successfully.",
      });
    } else if (voteRequestStatus === "error") {
      // Close modal and reset form on error (user can see error in toast from hook)
      setIsCreatingProposal(false);
      setNewProposal({
        type: "agent",
        targetAddress: "",
        targetValue: "",
      });
    }
  }, [voteRequestStatus, voteRequestError, isRequestingVote, toast]);

  // Show wallet connection check if not connected
  if (!isConnected) {
    return <WalletConnectionCheck />;
  }

  // Show no rollback wallet state if user doesn't have one
  if (hasRollbackWallet === false) {
    return <NoRollbackWalletState />;
  }

  // Show loading state while checking wallet (only initially)
  if (hasRollbackWallet === undefined || hasRollbackWallet === null) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-rollback-dark mb-3">
              Checking Wallet Status
            </h3>
            <p className="text-gray-600 mb-8 text-xs leading-relaxed">
              Verifying your rollback wallet configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse votes data from contract (NO optimistic updates)
  const contractVotes: Vote[] = votesData
    ? (votesData as any[]).map((vote, index) => ({
        voteId: index, // Use array index as voteId since contract doesn't return voteId
        voteType: Number(vote.voteType),
        targetAddress: vote.targetAddress,
        targetValue: vote.targetValue,
        initiator: vote.initiator,
        approvalsReceived: Number(vote.approvalsReceived),
        expirationTime: BigInt(Number(vote.timestamp) + 7 * 24 * 60 * 60), // Calculate expiration from timestamp + 7 days
        executed: vote.isExecuted, // Contract uses 'isExecuted' not 'executed'
      }))
    : [];

  // Use only contract votes (no dummy data)
  const allVotes = contractVotes;

  // Parse wallet data for emergency rollback options
  const wallets: WalletInfo[] = walletsData
    ? (walletsData as any[]).map((wallet) => ({
        walletAddress: wallet.walletAddress,
        isObsolete: wallet.isObsolete,
      }))
    : [];

  // Filter non-obsolete wallets excluding current user for emergency rollback
  const availableWalletsForEmergency = wallets.filter(
    (wallet) =>
      !wallet.isObsolete &&
      wallet.walletAddress.toLowerCase() !== address?.toLowerCase()
  );

  // Get total number of non-obsolete wallets for voting calculations
  const totalWalletOwners = wallets.filter(
    (wallet) => !wallet.isObsolete
  ).length;

  const activeVotes = allVotes.filter(
    (v) => !v.executed && Date.now() / 1000 < Number(v.expirationTime)
  );
  const completedVotes = allVotes.filter(
    (v) => v.executed || Date.now() / 1000 >= Number(v.expirationTime)
  );

  const handleVote = async (voteId: number, approve: boolean) => {
    try {
      await confirmVote(voteId, approve);

      // Track the user's vote locally
      setUserVotes((prev) => ({
        ...prev,
        [voteId]: approve,
      }));

      // Refresh votes after successful confirmation
      setTimeout(() => {
        refetchVotes();
      }, 2000);
    } catch (error) {
      console.error("Vote confirmation error:", error);
      toast({
        title: "Vote Failed",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProposal = () => {
    // Validate inputs
    if (!newProposal.targetAddress && newProposal.type !== "threshold") {
      toast({
        title: "Invalid Input",
        description: "Please provide a target address.",
        variant: "destructive",
      });
      return;
    }

    if (newProposal.type === "threshold") {
      const thresholdDays = parseInt(newProposal.targetValue);
      if (!thresholdDays || thresholdDays < 1) {
        toast({
          title: "Invalid Threshold",
          description: "Please provide a valid threshold in days (minimum 1).",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate target address format for agent and emergency
    if (
      (newProposal.type === "agent" || newProposal.type === "emergency") &&
      newProposal.targetAddress
    ) {
      if (
        !newProposal.targetAddress.startsWith("0x") ||
        newProposal.targetAddress.length !== 42
      ) {
        toast({
          title: "Invalid Address",
          description:
            "Please provide a valid Ethereum address (0x followed by 40 characters).",
          variant: "destructive",
        });
        return;
      }
    }

    // Debug the proposal before sending to contract
    console.log("🔄 Creating proposal with data:", {
      type: newProposal.type,
      targetAddress: newProposal.targetAddress,
      targetValue: newProposal.targetValue,
      walletAddress,
      userAddress: address,
    });

    if (newProposal.type === "agent") {
      console.log("👤 Requesting agent change to:", newProposal.targetAddress);
      requestAgentChange(newProposal.targetAddress as Address);
    } else if (newProposal.type === "threshold") {
      const thresholdDays = parseInt(newProposal.targetValue);
      console.log("⏰ Requesting threshold change to:", thresholdDays, "days");
      requestThresholdChange(thresholdDays);
    } else if (newProposal.type === "emergency") {
      console.log(
        "🚨 Requesting emergency rollback for:",
        newProposal.targetAddress
      );
      requestEmergencyRollback(newProposal.targetAddress as Address);
    }

    // Don't close modal immediately - let the useEffect handle it based on transaction status
    console.log("📝 Vote request initiated, waiting for transaction result...");
  };

  const getVoteTypeLabel = (voteType: number) => {
    switch (voteType) {
      case VOTE_TYPE.AGENT_CHANGE:
        return "Agent Change";
      case VOTE_TYPE.THRESHOLD_CHANGE:
        return "Threshold Change";
      case VOTE_TYPE.OBSOLETE_WALLET:
        return "Emergency Rollback";
      default:
        return "Unknown";
    }
  };

  const getVoteTypeIcon = (voteType: number) => {
    switch (voteType) {
      case VOTE_TYPE.AGENT_CHANGE:
        return <User className="h-4 w-4" />;
      case VOTE_TYPE.THRESHOLD_CHANGE:
        return <Clock className="h-4 w-4" />;
      case VOTE_TYPE.OBSOLETE_WALLET:
        return <Zap className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (vote: Vote) => {
    if (vote.executed) {
      return "bg-rollback-primary/10 text-rollback-primary border-rollback-primary";
    }
    if (Date.now() / 1000 >= Number(vote.expirationTime)) {
      return "bg-gray-100 text-gray-800 border-gray-300";
    }
    if (vote.voteType === VOTE_TYPE.OBSOLETE_WALLET) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getStatusLabel = (vote: Vote) => {
    if (vote.executed) return "Executed";
    if (Date.now() / 1000 >= Number(vote.expirationTime)) return "Expired";
    if (vote.voteType === VOTE_TYPE.OBSOLETE_WALLET) return "Emergency";
    return "Active";
  };

  const VoteCard = ({
    vote,
    totalWallets,
  }: {
    vote: Vote;
    totalWallets: number;
  }) => {
    const timeRemaining =
      Number(vote.expirationTime) - Math.floor(Date.now() / 1000);
    const isExpired = timeRemaining <= 0;
    const isExecuted = vote.executed;
    const canVote = !isExpired && !isExecuted;
    const isEmergency = vote.voteType === VOTE_TYPE.OBSOLETE_WALLET;
    const isInitiator = vote.initiator.toLowerCase() === address?.toLowerCase();
    const hasUserVoted = userVotes.hasOwnProperty(vote.voteId);
    const userVoteChoice = userVotes[vote.voteId]; // true=approved, false=rejected
    console.log({ userVotes });

    return (
      <Card
        className={`border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 rounded-xl border-2 hover:border-[#E9A344]/20 ${
          isEmergency ? "border-red-200 hover:border-red-300" : ""
        } ${isInitiator ? "ring-2 ring-blue-100 border-blue-200" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getVoteTypeIcon(vote.voteType)}
              <CardTitle
                className={`text-sm ${
                  isEmergency ? "text-red-900" : "text-gray-900"
                }`}
              >
                {getVoteTypeLabel(vote.voteType)}
              </CardTitle>
              {isEmergency && <Shield className="h-3 w-3 text-red-500" />}
            </div>
            <Badge
              variant="outline"
              className={`${getStatusColor(vote)} text-xs px-2 py-1`}
            >
              {getStatusLabel(vote)}
            </Badge>
          </div>

          {/* Target Info */}
          <div className="space-y-1">
            {vote.voteType === VOTE_TYPE.AGENT_CHANGE && (
              <p className="text-xs text-gray-600">
                <span className="font-medium">New Agent:</span>{" "}
                {vote.targetAddress.slice(0, 6)}...
                {vote.targetAddress.slice(-4)}
              </p>
            )}
            {vote.voteType === VOTE_TYPE.THRESHOLD_CHANGE && (
              <p className="text-xs text-gray-600">
                <span className="font-medium">New Threshold:</span>{" "}
                {(Number(vote.targetValue) / 86400).toFixed(0)} days
              </p>
            )}
            {vote.voteType === VOTE_TYPE.OBSOLETE_WALLET && (
              <p className="text-xs text-red-600">
                <span className="font-medium">Target Wallet:</span>{" "}
                {vote.targetAddress.slice(0, 6)}...
                {vote.targetAddress.slice(-4)}
              </p>
            )}

            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Initiator: {vote.initiator.slice(0, 6)}...
                {vote.initiator.slice(-4)}
              </span>
              <span>ID: #{vote.voteId}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  Approvals: {vote.approvalsReceived}/{totalWallets}
                </span>
                <span>
                  {isExpired
                    ? "Expired"
                    : `${Math.max(0, Math.floor(timeRemaining / 3600))}h left`}
                </span>
              </div>
              <Progress
                value={Math.min(
                  100,
                  (vote.approvalsReceived / totalWallets) * 100
                )}
                className={`h-2 ${isEmergency ? "bg-red-100" : ""}`}
              />
            </div>
            {isInitiator && !isExecuted && !isExpired && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-700 font-medium text-center">
                  🕒 Waiting for others to approve or reject
                </p>
              </div>
            )}
            {hasUserVoted && !isInitiator && (
              <div
                className={`${
                  userVoteChoice
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                } rounded-lg p-2`}
              >
                <p
                  className={`text-xs font-medium text-center ${
                    userVoteChoice ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {userVoteChoice
                    ? "✅ You approved this proposal"
                    : "❌ You rejected this proposal"}
                </p>
              </div>
            )}
            {isEmergency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ Emergency: Will trigger immediate asset transfer
                </p>
              </div>
            )}
            {/* Action Buttons - Only show if user hasn't voted yet */}
            {canVote && !isInitiator && !hasUserVoted && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleVote(vote.voteId, true)}
                  disabled={isConfirmingVote}
                  size="sm"
                  className={`flex-1 text-xs ${
                    isEmergency
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                  }`}
                >
                  {isConfirmingVote ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      {isEmergency ? "Authorize" : "Approve"}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleVote(vote.voteId, false)}
                  disabled={isConfirmingVote}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Voting</h1>
          </div>

          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchVotes()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreatingProposal(true)}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </div>

        {/* Proposals */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 rounded-2xl p-1 h-12 w-fit">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-rollback-primary data-[state=active]:text-white rounded-xl px-5 h-10"
            >
              Active ({activeVotes.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-rollback-primary data-[state=active]:text-white rounded-xl px-5 h-10"
            >
              Completed ({completedVotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {!hasInitiallyLoaded && isLoadingVotes ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rollback-primary" />
                <p className="text-gray-600">Loading votes from contract...</p>
              </div>
            ) : activeVotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No Active Proposals
                </h3>
                <p className="text-gray-600 mb-6">
                  There are currently no active voting proposals.
                </p>
                <Button
                  onClick={() => setIsCreatingProposal(true)}
                  className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Proposal
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeVotes.map((vote) => (
                  <VoteCard
                    key={vote.voteId}
                    vote={vote}
                    totalWallets={totalWalletOwners}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedVotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No Completed Proposals
                </h3>
                <p className="text-gray-600">
                  Completed and expired proposals will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {completedVotes.map((vote) => (
                  <VoteCard
                    key={vote.voteId}
                    vote={vote}
                    totalWallets={totalWalletOwners}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Proposal Modal */}
        {isCreatingProposal && (
          <CustomModal
            isOpen={true}
            onClose={() => {
              setIsCreatingProposal(false);
              setNewProposal({
                type: "agent",
                targetAddress: "",
                targetValue: "",
              });
            }}
            showCancelButton={false}
            title="Create New Proposal"
            description="Submit a new proposal for voting"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="proposalType">Proposal Type</Label>
                <Select
                  value={newProposal.type}
                  onValueChange={(value: ProposalType) =>
                    setNewProposal((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent Change</SelectItem>
                    <SelectItem value="threshold">Threshold Change</SelectItem>
                    <SelectItem value="emergency">
                      Emergency Rollback
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newProposal.type === "agent" ||
                newProposal.type === "emergency") && (
                <div>
                  <Label htmlFor="targetAddress">
                    {newProposal.type === "agent"
                      ? "New Agent Address"
                      : "Wallet to Mark for Emergency Rollback"}
                  </Label>
                  {newProposal.type === "emergency" &&
                    availableWalletsForEmergency.length > 0 && (
                      <Select
                        value={newProposal.targetAddress}
                        onValueChange={(value) =>
                          setNewProposal((prev) => ({
                            ...prev,
                            targetAddress: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select wallet to mark obsolete" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableWalletsForEmergency.map((wallet) => (
                            <SelectItem
                              key={wallet.walletAddress}
                              value={wallet.walletAddress}
                            >
                              {wallet.walletAddress.slice(0, 6)}...
                              {wallet.walletAddress.slice(-4)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  <Input
                    id="targetAddress"
                    placeholder="0x... or select from dropdown above"
                    value={newProposal.targetAddress}
                    onChange={(e) =>
                      setNewProposal((prev) => ({
                        ...prev,
                        targetAddress: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                  {newProposal.type === "emergency" && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Emergency rollback will immediately mark this wallet as
                      obsolete and trigger asset transfers.
                    </p>
                  )}
                </div>
              )}

              {newProposal.type === "threshold" && (
                <div>
                  <Label htmlFor="newThreshold">New Threshold (days)</Label>
                  <Input
                    id="newThreshold"
                    type="number"
                    placeholder="30"
                    min="1"
                    value={newProposal.targetValue}
                    onChange={(e) =>
                      setNewProposal((prev) => ({
                        ...prev,
                        targetValue: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 1 day, affects when automatic rollbacks can be
                    triggered.
                  </p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingProposal(false)}
                  disabled={isRequestingVote}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProposal}
                  disabled={isRequestingVote}
                  className={`flex-1 ${
                    newProposal.type === "emergency"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                  }`}
                >
                  {isRequestingVote ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      {newProposal.type === "emergency" && (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Create{" "}
                      {newProposal.type === "emergency" ? "Emergency" : ""}{" "}
                      Proposal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CustomModal>
        )}
      </div>
    </div>
  );
}
