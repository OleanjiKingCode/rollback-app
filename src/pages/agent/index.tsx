"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet } from "@/hooks/useRollback";
import { useUser } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";
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
  ExternalLink,
  Settings,
  User,
  Ban,
  RefreshCw,
  Info,
  Zap,
  Key,
} from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";

const agentCapabilities = [
  "Automated activity monitoring",
  "Enhanced security validations",
  "Block hash randomization",
  "Emergency recovery assistance",
  "Gas optimization for transactions",
  "Multi-signature coordination",
];

// Wallet connection states
const WalletConnectionState = ({ isConnected }: any) => {
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg bg-white rounded-3xl p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Wallet Required
            </h3>
            <p className="text-gray-600 mb-8 text-xs leading-relaxed">
              Connect your wallet to manage and configure agents for your
              rollback protection system.
            </p>
            <Button
              onClick={openConnectModal}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-6 py-2 text-sm rounded-xl"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// No Rollback Wallet State
const NoRollbackWalletState = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-full flex items-center justify-center mx-auto mb-8">
            <Shield className="h-6 w-6 text-white" />
          </div>

          <h2 className="text-lg font-bold text-rollback-dark mb-4">
            No Rollback Wallet Found
          </h2>

          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            You need to create a rollback wallet before you can manage agents.
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
  const { user, hasRollbackWallet, isLoading, isError, refetch } =
    useRollbackWallet();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [newAgentAddress, setNewAgentAddress] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set selected wallet from user data
  useEffect(() => {
    if (user) {
      setSelectedWallet({
        id: user.user.id,
        address: user.user.address,
        agentWallet: user.rollbackConfig?.agent_wallet || null,
        status: user.rollbackConfig?.agent_wallet ? "active" : "no-agent",
      });
    }
  }, [user]);

  // Show wallet connection state if not connected
  if (!isConnected) {
    return <WalletConnectionState isConnected={isConnected} />;
  }

  // Show no rollback wallet state
  if (hasRollbackWallet === false) {
    return <NoRollbackWalletState />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "no-agent":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleGenerateAgent = async () => {
    setIsGenerating(true);
    try {
      // TODO: Call actual agent generation API
      toast.success(
        "Agent Generated",
        "New agent wallet has been generated successfully."
      );
    } catch (error) {
      toast.error(
        "Generation Failed",
        "Failed to generate agent wallet. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!newAgentAddress || !selectedWallet) return;

    setIsAssigning(true);
    try {
      // TODO: Call actual agent assignment API
      toast.success(
        "Agent Assigned",
        "Agent wallet has been assigned successfully."
      );
      setNewAgentAddress("");
    } catch (error) {
      toast.error(
        "Assignment Failed",
        "Failed to assign agent wallet. Please try again."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-rollback-dark mb-2">
              Agent Management
            </h1>
            <p className="text-sm text-gray-600">
              Configure automated agents for your rollback wallet system
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Wallet Selection Card */}
        <Card className="border-gray-200 bg-white mb-8 rounded-3xl border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span>Rollback Wallet</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your current rollback wallet configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWallet ? (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                <span className="font-mono text-sm">
                  {selectedWallet.address?.slice(0, 10)}...
                  {selectedWallet.address?.slice(-8)}
                </span>
                <Badge
                  className={`${getStatusColor(
                    selectedWallet.status || "no-agent"
                  )} rounded-full`}
                >
                  {selectedWallet.agentWallet ? "Agent Active" : "No Agent"}
                </Badge>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                No wallet found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Agent Status */}
          <Card className="border-gray-200 bg-white rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-rollback-primary" />
                <span>Current Agent</span>
              </CardTitle>
              <CardDescription>
                Currently assigned agent wallet for automated operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWallet?.agentWallet ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Agent Active
                        </p>
                        <p className="text-sm text-green-700 font-mono">
                          {selectedWallet.agentWallet.slice(0, 6)}...
                          {selectedWallet.agentWallet.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedWallet.agentWallet
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Capabilities:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Monitor wallet activity</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Execute rollback transactions</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Send activity warnings</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    No Agent Assigned
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    No automated agent is currently configured for this wallet.
                  </p>
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Without an agent, rollback operations must be performed
                      manually.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Assignment/Generation */}
          <Card className="border-gray-200 bg-white rounded-3xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-rollback-primary" />
                <span>Agent Configuration</span>
              </CardTitle>
              <CardDescription>
                Generate or assign an agent wallet for automated operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generate New Agent */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Generate New Agent
                </h4>
                <p className="text-sm text-gray-600">
                  Create a new agent wallet with automated rollback
                  capabilities.
                </p>
                <Button
                  onClick={handleGenerateAgent}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-[#E9A344] to-[#D4941A] text-white"
                >
                  {isGenerating ? (
                    <>
                      <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Agent Wallet
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Assign Existing Agent */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">
                  Assign Existing Agent
                </h4>
                <p className="text-sm text-gray-600">
                  Use an existing wallet address as your rollback agent.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="agent-address" className="text-sm">
                    Agent Wallet Address
                  </Label>
                  <Input
                    id="agent-address"
                    type="text"
                    placeholder="0x..."
                    value={newAgentAddress}
                    onChange={(e) => setNewAgentAddress(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleAssignAgent}
                  disabled={!newAgentAddress || isAssigning}
                  variant="outline"
                  className="w-full"
                >
                  {isAssigning ? (
                    <>
                      <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Assign Agent
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <Card className="border-gray-200 bg-white mt-8 rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-rollback-primary" />
              <span>How Agents Work</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Monitor</h4>
                <p className="text-sm text-gray-600">
                  Continuously monitors your wallet activity and inactivity
                  periods.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Alert</h4>
                <p className="text-sm text-gray-600">
                  Sends warnings when inactivity thresholds are approaching.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Execute</h4>
                <p className="text-sm text-gray-600">
                  Automatically executes rollback operations when thresholds are
                  exceeded.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
