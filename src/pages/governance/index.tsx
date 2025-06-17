"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { CustomModal, InfoModal } from "@/components/CustomModal";
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
  Loader2,
  WifiOff,
  Wallet,
} from "lucide-react";

type ProposalType = "threshold" | "obsolete" | "agent";
type ProposalStatus = "active" | "passed" | "rejected" | "expired";

type Proposal = {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  status: ProposalStatus;
  votes: {
    approve: number;
    reject: number;
    total: number;
  };
  timeRemaining: string;
  initiator: string;
  walletAddress?: string;
  parameters?: any;
};

const mockProposals: Proposal[] = [
  {
    id: "1",
    type: "threshold",
    title: "Update Inactivity Threshold",
    description:
      "Proposal to change inactivity threshold from 30 days to 60 days for enhanced security",
    status: "active",
    votes: { approve: 3, reject: 1, total: 4 },
    timeRemaining: "5 days",
    initiator: "0x1234...5678",
    walletAddress: "0xabcd...efgh",
    parameters: { newThreshold: 60, currentThreshold: 30 },
  },
  {
    id: "2",
    type: "agent",
    title: "Agent Wallet Assignment",
    description: "Proposal to assign new Agent Wallet for architecture support",
    status: "active",
    votes: { approve: 2, reject: 0, total: 2 },
    timeRemaining: "3 days",
    initiator: "0x5678...9012",
    walletAddress: "0xabcd...efgh",
    parameters: { newAgent: "0x9999...1111" },
  },
  {
    id: "3",
    type: "obsolete",
    title: "Mark Wallet Obsolete",
    description: "Proposal to mark wallet as obsolete due to security concerns",
    status: "passed",
    votes: { approve: 4, reject: 1, total: 5 },
    timeRemaining: "Completed",
    initiator: "0x9012...3456",
    walletAddress: "0x1111...2222",
  },
];

// Wallet connection check component
const WalletConnectionCheck = () => {
  const { isConnected, isConnecting, connect } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-rollback-primary" />
            <h3 className="text-xl font-semibold text-rollback-dark mb-3">
              Connecting Wallet
            </h3>
            <p className="text-gray-600 text-sm">
              Please approve the connection in your wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <WifiOff className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-rollback-dark mb-3">
              Wallet Required
            </h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Connect your wallet to participate in governance and manage your
              rollback wallet settings.
            </p>
            <Button
              onClick={connect}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-3 text-lg"
            >
              <Wallet className="h-5 w-5 mr-3" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default function Governance() {
  const { isConnected } = useWallet();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    type: "threshold" as ProposalType,
    walletAddress: "",
    parameters: {},
  });
  const { toast } = useToast();

  // Show wallet connection check if not connected
  if (!isConnected) {
    return <WalletConnectionCheck />;
  }

  const activeProposals = mockProposals.filter((p) => p.status === "active");
  const completedProposals = mockProposals.filter((p) => p.status !== "active");

  const handleVote = (proposalId: string, vote: "approve" | "reject") => {
    toast({
      title: "Vote Cast",
      description: `Your ${vote} vote has been recorded successfully.`,
    });
  };

  const handleCreateProposal = () => {
    setIsCreatingProposal(false);
    toast({
      title: "Proposal Created",
      description: "Your governance proposal has been submitted successfully.",
    });

    setNewProposal({
      type: "threshold",
      walletAddress: "",
      parameters: {},
    });
  };

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "passed":
        return "bg-rollback-primary/10 text-rollback-primary border-rollback-primary";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: ProposalType) => {
    switch (type) {
      case "threshold":
        return <Clock className="h-4 w-4" />;
      case "obsolete":
        return <X className="h-4 w-4" />;
      case "agent":
        return <User className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
    const approvalPercentage =
      proposal.votes.total > 0
        ? (proposal.votes.approve / proposal.votes.total) * 100
        : 0;

    return (
      <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getTypeIcon(proposal.type)}
              <CardTitle className="text-lg text-gray-900">
                {proposal.title}
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className={getStatusColor(proposal.status)}
            >
              {proposal.status}
            </Badge>
          </div>
          <CardDescription className="text-gray-600">
            {proposal.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Approval: {proposal.votes.approve}/{proposal.votes.total}
                </span>
                <span>{Math.round(approvalPercentage)}%</span>
              </div>
              <Progress value={approvalPercentage} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Time Remaining: {proposal.timeRemaining}</span>
              <span>Initiator: {proposal.initiator}</span>
            </div>

            {proposal.status === "active" && (
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleVote(proposal.id, "approve")}
                  className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(proposal.id, "reject")}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedProposal(proposal)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  View Details
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Governance
            </h1>
            <p className="text-sm text-gray-600">
              Participate in wallet governance and voting
            </p>
          </div>

          <Button
            onClick={() => setIsCreatingProposal(true)}
            className="mt-4 lg:mt-0 bg-rollback-primary hover:bg-rollback-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>

        {/* Proposals */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border border-gray-200">
            <TabsTrigger value="active">
              Active Proposals ({activeProposals.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeProposals.length === 0 ? (
              <Card className="border-gray-200 bg-white rounded-3xl border-2">
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Proposals
                  </h3>
                  <p className="text-gray-600">
                    There are currently no active governance proposals. Create
                    one to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Proposal Modal */}
        <CustomModal
          isOpen={isCreatingProposal}
          onClose={() => setIsCreatingProposal(false)}
          title="Create New Proposal"
          description="Submit a new governance proposal for voting"
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
                  <SelectItem value="threshold">Threshold Change</SelectItem>
                  <SelectItem value="obsolete">Mark Obsolete</SelectItem>
                  <SelectItem value="agent">Agent Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="walletAddress">Target Wallet Address</Label>
              <Input
                id="walletAddress"
                placeholder="0x..."
                value={newProposal.walletAddress}
                onChange={(e) =>
                  setNewProposal((prev) => ({
                    ...prev,
                    walletAddress: e.target.value,
                  }))
                }
              />
            </div>

            {newProposal.type === "threshold" && (
              <div>
                <Label htmlFor="newThreshold">New Threshold (days)</Label>
                <Input
                  id="newThreshold"
                  type="number"
                  placeholder="30"
                  onChange={(e) =>
                    setNewProposal((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        newThreshold: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            )}

            {newProposal.type === "agent" && (
              <div>
                <Label htmlFor="newAgent">New Agent Address</Label>
                <Input
                  id="newAgent"
                  placeholder="0x..."
                  onChange={(e) =>
                    setNewProposal((prev) => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        newAgent: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreatingProposal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProposal}
                className="flex-1 bg-rollback-primary hover:bg-rollback-primary/90 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </CustomModal>

        {/* Proposal Detail Modal */}
        <InfoModal
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          title={selectedProposal?.title || ""}
          description={selectedProposal?.description || ""}
        >
          {selectedProposal && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-900">
                    Proposal Details
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Type:</strong> {selectedProposal.type}
                    </p>
                    <p>
                      <strong>Initiator:</strong> {selectedProposal.initiator}
                    </p>
                    <p>
                      <strong>Target Wallet:</strong>{" "}
                      {selectedProposal.walletAddress}
                    </p>
                    <p>
                      <strong>Time Remaining:</strong>{" "}
                      {selectedProposal.timeRemaining}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-900">
                    Vote Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Approve:</span>
                      <span>{selectedProposal.votes.approve}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reject:</span>
                      <span>{selectedProposal.votes.reject}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{selectedProposal.votes.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProposal.parameters && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-900">Parameters</h4>
                  <pre className="text-sm text-gray-600">
                    {JSON.stringify(selectedProposal.parameters, null, 2)}
                  </pre>
                </div>
              )}

              {selectedProposal.status === "active" && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      handleVote(selectedProposal.id, "approve");
                      setSelectedProposal(null);
                    }}
                    className="flex-1 bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleVote(selectedProposal.id, "reject");
                      setSelectedProposal(null);
                    }}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </InfoModal>
      </div>
    </div>
  );
}
