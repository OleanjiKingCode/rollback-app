"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/api";
import {
  User,
  Shield,
  Check,
  Plus,
  Settings,
  Copy,
  Ban,
  Wallet,
} from "lucide-react";

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
          <div className="text-center max-w-lg bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
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

export default function AgentManagement() {
  const { isConnected, address } = useAccount();
  const { user, isLoading } = useUser(address);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [newAgentAddress, setNewAgentAddress] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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

  // Show loading state while user data is being fetched
  if (isLoading || !selectedWallet) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rollback-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-rollback-dark mb-3">
              Loading Agent Management
            </h3>
            <p className="text-gray-600 text-sm">
              Fetching your rollback wallet information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAssignAgent = async () => {
    if (!newAgentAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid agent wallet address.",
        variant: "destructive",
      });
      return;
    }
    setIsAssigning(true);
    try {
      // Mock agent assignment - replace with actual contract call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast({
        title: "Agent Assigned",
        description:
          "Agent wallet has been successfully assigned to your rollback wallet.",
      });
      setNewAgentAddress("");
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign agent wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleGenerateAgent = async () => {
    setIsGenerating(true);
    try {
      // Mock agent generation - replace with actual contract call
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const generatedAddress = "0x" + Math.random().toString(16).substr(2, 40);
      setNewAgentAddress(generatedAddress);
      toast({
        title: "Agent Generated",
        description: "A new agent wallet has been generated and whitelisted.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate agent wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Agent wallet address copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#E9A344]/10 text-[#E9A344] border-[#E9A344]";
      case "no-agent":
        return "bg-gray-100 text-gray-600 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-0 pb-6">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Wallet Agent Management
          </h1>
          <p className="text-gray-600 text-xs max-w-2xl mx-auto">
            Manage Agent Wallets for enhanced architecture security and
            automation
          </p>
        </div>

        {/* Wallet Selector */}
        <Card className="border-gray-200 bg-white mb-8 rounded-3xl border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span>Select Rollback Wallet</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose which rollback wallet to manage the agent for
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
                {isLoading ? "Loading wallet..." : "No wallet found"}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Agent Status */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span>Current Agent Status</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage the current agent wallet assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWallet?.agentWallet ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-[#E9A344]/10 to-[#D4941A]/10 border border-[#E9A344]/20 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="h-4 w-4 text-[#E9A344]" />
                      <span className="font-medium text-[#E9A344]">
                        Agent Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-900">
                        {selectedWallet?.agentWallet}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyAddress(selectedWallet?.agentWallet || "")
                        }
                        className="rounded-xl"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Agent wallet is active and providing:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {agentCapabilities
                        .slice(0, 3)
                        .map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-600">
                        No Agent Assigned
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      This rollback wallet doesn't have an agent wallet
                      assigned. Consider assigning one for enhanced features.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Benefits of assigning an agent wallet:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {agentCapabilities
                        .slice(0, 3)
                        .map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign/Update Agent */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <span>
                  {selectedWallet?.agentWallet ? "Update" : "Assign"} Agent
                  Wallet
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                {selectedWallet?.agentWallet
                  ? "Update the current agent wallet assignment"
                  : "Assign a new agent wallet for features"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="agentAddress"
                  className="text-sm font-medium text-gray-900"
                >
                  Agent Wallet Address
                </Label>
                <Input
                  id="agentAddress"
                  placeholder="0x..."
                  value={newAgentAddress}
                  onChange={(e) => setNewAgentAddress(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] rounded-xl"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateAgent}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1 border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white rounded-xl"
                >
                  {isGenerating ? "Generating..." : "Generate Agent"}
                </Button>
                <Button
                  onClick={handleAssignAgent}
                  disabled={isAssigning || !newAgentAddress}
                  className="flex-1 bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white rounded-xl"
                >
                  {isAssigning ? "Assigning..." : "Assign Agent"}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-medium text-sm mb-2 text-blue-800">
                  Agent Wallet Requirements:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Must be a valid Ethereum address</li>
                  <li>• Will be whitelisted for operations</li>
                  <li>• Can be changed through governance</li>
                  <li>• Enables block hash randomization</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
