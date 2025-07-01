"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet } from "@/hooks/useRollback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Wallet,
  Plus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Ban,
  Shuffle,
  User,
  Clock,
  RefreshCw,
  Loader2,
  Unlink,
} from "lucide-react";
import {
  useGetWalletSystemConfig,
  useGetAllVotes,
} from "@/hooks/contracts/useSimpleRollbackRead";
import { useVoteManagement } from "@/hooks/contracts/useWalletOperations";
import { VOTE_TYPE } from "@/config/contracts";
import { type Address } from "viem";

// Generate a new agent wallet
const generateAgentWallet = () => {
  // Simple wallet generation for demo (in production, use proper crypto libraries)
  const privateKey = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
  const address = `0x${Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;

  return { privateKey, address };
};

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
              <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Unlink className="h-10 w-10 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>

              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Connect your wallet to manage agents and automated rollback
                operations.
              </p>

              <button
                onClick={openConnectModal}
                className="bg-gradient-to-r from-rollback-primary to-rollback-primary/90 hover:from-rollback-primary/90 hover:to-rollback-primary text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
              >
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
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
            You need a rollback wallet to manage agents. Create one to get
            started with decentralized asset protection.
          </p>
          <Button
            onClick={() => navigate("/create")}
            className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-4 text-sm rounded-xl"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-3" />
            Create Rollback Wallet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AgentManagement() {
  const { isConnected, address } = useAccount();
  const { user, hasRollbackWallet } = useRollbackWallet();
  const [newAgentAddress, setNewAgentAddress] = useState("");
  const [generatedAgent, setGeneratedAgent] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const navigate = useNavigate();

  // Get wallet address for contract calls
  const walletAddress = user?.rollbackConfig
    ?.rollback_wallet_address as Address;

  // Fetch system config from contract
  const { data: systemConfig, refetch: refetchConfig } =
    useGetWalletSystemConfig(walletAddress, !!walletAddress);

  // Fetch active votes to check for pending agent changes
  const { data: votesData } = useGetAllVotes(walletAddress, !!walletAddress);

  // Vote management hook
  const { requestAgentChange, isRequestingVote } =
    useVoteManagement(walletAddress);

  // Show wallet connection state if not connected
  if (!isConnected) {
    return <WalletConnectionCheck />;
  }

  // Show no rollback wallet state if user doesn't have one
  if (hasRollbackWallet === false) {
    return <NoRollbackWalletState />;
  }

  // Extract current agent from system config
  const currentAgent = systemConfig?.[3]; // agentWallet is the 4th element in the tuple

  // Check for pending agent change votes
  const pendingAgentVotes = votesData
    ? (votesData as any[]).filter(
        (vote: any) =>
          Number(vote.voteType) === VOTE_TYPE.AGENT_CHANGE &&
          !vote.executed &&
          Date.now() / 1000 < Number(vote.expirationTime)
      )
    : [];

  const hasPendingAgentVote = pendingAgentVotes.length > 0;

  const getAgentStatus = () => {
    if (hasPendingAgentVote) {
      return "pending";
    }
    if (
      currentAgent &&
      currentAgent !== "0x0000000000000000000000000000000000000000"
    ) {
      return "active";
    }
    return "none";
  };

  const agentStatus = getAgentStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleGenerateAgent = () => {
    const agent = generateAgentWallet();
    setGeneratedAgent(agent);
    setNewAgentAddress(agent.address);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.plain(`${label} copied to clipboard`);
  };

  const handleProposeAgentChange = async () => {
    if (!newAgentAddress) {
      toast.error(
        "Agent Required",
        "Please enter or generate an agent address."
      );
      return;
    }

    try {
      await requestAgentChange(newAgentAddress as Address);
      toast.success(
        "Agent Change Proposed",
        "Agent change vote has been created. Other wallet owners need to approve it."
      );
      setNewAgentAddress("");
      setGeneratedAgent(null);
      await refetchConfig();
    } catch (error) {
      toast.error(
        "Proposal Failed",
        "Failed to propose agent change. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Agent Management
            </h1>
            <p className="text-xs text-gray-600">
              Configure automated rollback operations and agent wallets
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/governance")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4 mr-2" />
              View Votes
            </Button>
            <Button
              size="sm"
              onClick={() => refetchConfig()}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Agent Status */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Bot className="h-5 w-5 mr-2 text-rollback-primary" />
                Current Agent
              </CardTitle>
              <CardDescription>
                Wallet authorized to perform automated rollbacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                {currentAgent &&
                currentAgent !==
                  "0x0000000000000000000000000000000000000000" ? (
                  <>
                    <span className="font-mono text-sm">
                      {currentAgent.slice(0, 10)}...{currentAgent.slice(-8)}
                    </span>
                    <Badge
                      className={`${getStatusColor(agentStatus)} rounded-full`}
                    >
                      {agentStatus === "active" ? "Agent Active" : agentStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyToClipboard(currentAgent, "Agent address")
                      }
                      className="ml-auto"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 text-sm">
                      No agent assigned
                    </span>
                    <Badge
                      className={`${getStatusColor(agentStatus)} rounded-full`}
                    >
                      No Agent
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agent Operations */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-rollback-primary" />
                Agent Operations
              </CardTitle>
              <CardDescription>
                Manage automated rollback settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentAgent &&
              currentAgent !== "0x0000000000000000000000000000000000000000" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Agent Active
                        </p>
                        <p className="text-sm text-green-700 font-mono">
                          {currentAgent.slice(0, 6)}...{currentAgent.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/governance")}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Manage
                    </Button>
                  </div>

                  {hasPendingAgentVote && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Agent change vote in progress. Check the voting page for
                        details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Agent Assigned
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Assign an agent to enable automated rollback operations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Configuration */}
          <Card className="border-gray-200 bg-white rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-rollback-primary" />
                Configure Agent
              </CardTitle>
              <CardDescription>
                Set up or change the agent wallet for automated operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Generate New Agent
                </h4>
                <p className="text-sm text-gray-600">
                  Create a new wallet to use as your automated rollback agent.
                </p>
                <Button
                  onClick={handleGenerateAgent}
                  variant="outline"
                  className="border-rollback-primary text-rollback-primary hover:bg-rollback-primary/5"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generate Agent Wallet
                </Button>

                {generatedAgent && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-2">
                        <p className="font-medium">
                          Agent Generated Successfully!
                        </p>
                        <div className="font-mono text-xs bg-white p-2 rounded border">
                          <p>
                            <strong>Address:</strong> {generatedAgent.address}
                          </p>
                          <p>
                            <strong>Private Key:</strong>{" "}
                            {generatedAgent.privateKey.slice(0, 20)}...
                          </p>
                        </div>
                        <p className="text-xs">Keep your private key secure!</p>
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopyToClipboard(
                                generatedAgent.address,
                                "Agent address"
                              )
                            }
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Address
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopyToClipboard(
                                generatedAgent.privateKey,
                                "Private key"
                              )
                            }
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Private Key
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Set Agent Address</h4>
                <p className="text-sm text-gray-600">
                  Enter an existing wallet address to use as the agent, or use
                  the generated address above.
                </p>
                <div className="flex space-x-2">
                  <Input
                    placeholder="0x..."
                    value={newAgentAddress}
                    onChange={(e) => setNewAgentAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleProposeAgentChange}
                    disabled={
                      isRequestingVote ||
                      !newAgentAddress ||
                      hasPendingAgentVote
                    }
                    className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                  >
                    {isRequestingVote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Proposing...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Propose Agent Change
                      </>
                    )}
                  </Button>
                </div>
                {hasPendingAgentVote && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Agent change vote already in progress. Wait for it to
                    complete before proposing another.
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">
                      Voting Required
                    </h4>
                    <p className="text-xs text-blue-700">
                      Agent changes require approval from multiple wallet
                      owners. A vote will be created when you propose a change.
                      You can monitor the voting progress on the governance
                      page.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/governance")}
                      className="text-blue-600 hover:text-blue-700 mt-2 p-0 h-auto"
                    >
                      View Voting Page →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
