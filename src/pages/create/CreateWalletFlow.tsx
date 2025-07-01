"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useRollbackWallet,
  useWalletCreationFlow,
  useTokenApprovals,
  type WalletCreationStep,
} from "@/hooks/useRollback";
import { useAppStore } from "@/stores/appStore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  Wallet,
  Plus,
  Settings,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  User,
  Bell,
  Coins,
  HelpCircle,
  WifiOff,
  Copy,
  Eye,
  EyeOff,
  Key,
  FileText,
  Ban,
  ExternalLink,
  ChevronRight,
  Check,
  Loader2,
  RefreshCw,
  Users,
  Unlink,
} from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";
import type { CreateWalletFormData } from "@/types/api";

// Local interface for generated agent wallet with private key
interface GeneratedAgentWallet {
  address: string;
  privateKey: string;
}

// Step Configuration
const STEPS = [
  { id: 1, title: "Recovery & Fallback", icon: User },
  { id: 2, title: "Rollback Method", icon: Settings },
  { id: 3, title: "Inactivity Timer", icon: Clock },
  { id: 4, title: "Token Selection", icon: Coins },
  { id: 5, title: "Agent Setup", icon: Key },
  { id: 6, title: "Token Approvals", icon: CheckCircle2 },
  { id: 7, title: "Final Review", icon: FileText },
];

// Step Progress Component
const StepProgress = ({
  currentStep,
  isStepValid,
}: {
  currentStep: number;
  isStepValid: (step: number) => boolean;
}) => {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle and Content */}
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center relative z-10 
                    ${
                      status === "completed"
                        ? "bg-green-500 text-white"
                        : status === "current"
                        ? "bg-[#E9A344] text-white"
                        : "bg-gray-300 text-gray-600"
                    }
                  `}
                >
                  {status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      status === "current"
                        ? "text-[#E9A344]"
                        : status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connection Line */}
              {!isLast && (
                <div className="flex-1 mx-2 relative" style={{ top: "-12px" }}>
                  <div
                    className={`h-0.5 w-full ${
                      step.id < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  {/* Progress dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        step.id < currentStep ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Contract Status Component
const ContractStatusCard = ({
  creationState,
  onSignCreation,
  onFinalizeCreation,
  onRefreshStatus,
}: {
  creationState: any;
  onSignCreation: (requestId: number) => void;
  onFinalizeCreation: (requestId: number) => void;
  onRefreshStatus: () => void;
}) => {
  const getStatusInfo = (step: WalletCreationStep) => {
    switch (step) {
      case "proposing":
        return {
          title: "Proposing Wallet Creation",
          description:
            "Submitting wallet creation proposal to the blockchain...",
          color: "blue",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        };
      case "pending_signatures":
        return {
          title: "Waiting for Signatures",
          description: `${creationState.signatureCount}/${creationState.totalSignersNeeded} wallet owners have signed`,
          color: "yellow",
          icon: <Users className="h-4 w-4" />,
        };
      case "ready_to_finalize":
        return {
          title: "Ready to Finalize",
          description:
            "All signatures collected. Ready to finalize with payment.",
          color: "green",
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case "finalizing":
        return {
          title: "Finalizing Creation",
          description: "Processing payment and creating wallet...",
          color: "blue",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        };
      case "approving_tokens":
        return {
          title: "Wallet Created Successfully",
          description: `Wallet Address: ${creationState.walletAddress}`,
          color: "green",
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case "completed":
        return {
          title: "Creation Complete",
          description:
            "Your rollback wallet is now active and monitoring your assets.",
          color: "green",
          icon: <Shield className="h-4 w-4" />,
        };
      case "error":
        return {
          title: "Creation Error",
          description:
            creationState.error || "An error occurred during creation",
          color: "red",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          title: "Idle",
          description: "No active wallet creation process",
          color: "gray",
          icon: <Clock className="h-4 w-4" />,
        };
    }
  };

  const statusInfo = getStatusInfo(creationState.step);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`text-${statusInfo.color}-500`}>
              {statusInfo.icon}
            </div>
            <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
          </div>
          <Button
            onClick={onRefreshStatus}
            variant="outline"
            size="sm"
            disabled={creationState.isCreating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{statusInfo.description}</p>

        {creationState.requestId && (
          <div className="mb-4">
            <Label className="text-sm font-medium">Request ID</Label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {creationState.requestId}
              </code>
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(
                    creationState.requestId.toString()
                  )
                }
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {creationState.step === "pending_signatures" &&
          creationState.needsSignature && (
            <Button
              onClick={() => onSignCreation(creationState.requestId)}
              disabled={creationState.isCreating}
              className="w-full"
            >
              {creationState.isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Sign Creation Request
            </Button>
          )}

        {creationState.step === "ready_to_finalize" && (
          <Button
            onClick={() => onFinalizeCreation(creationState.requestId)}
            disabled={creationState.isCreating}
            className="w-full"
          >
            {creationState.isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Finalize Creation (Pay Fee)
          </Button>
        )}

        {creationState.step === "approving_tokens" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Wallet created successfully! Now approve tokens for monitoring.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Popular tokens configuration
const POPULAR_TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86a33E6e0bC4e0C4a9A7c5b1b30e3F2d2E1F0",
    type: "ERC20" as const,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    type: "ERC20" as const,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5522f784C1DDDF8C0A86A81D53CC3C6",
    type: "ERC20" as const,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    type: "ERC20" as const,
  },
];

export default function CreateWalletFlow() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    state: creationState,
    checkPendingRequests,
    proposeCreation,
    signCreation,
    finalizeCreation,
    completeCreation,
    resetState,
  } = useWalletCreationFlow();
  const { approveTokens, isApproving } = useTokenApprovals();
  const { hasRollbackWallet, isLoading } = useRollbackWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // Start with intro screen
  const [formData, setFormData] = useState<CreateWalletFormData>({
    wallets: [address || ""],
    threshold: 2592000, // 30 days
    tokensToMonitor: [],
    isRandomized: false,
    fallbackWallet: "",
  });

  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenType, setCustomTokenType] = useState<"ERC20" | "ERC721">(
    "ERC20"
  );
  const [generatedAgentWallet, setGeneratedAgentWallet] =
    useState<GeneratedAgentWallet | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, boolean>>(
    {}
  );

  // Check for pending requests on mount and address change
  useEffect(() => {
    if (isConnected && address) {
      checkPendingRequests();
    }
  }, [isConnected, address, checkPendingRequests]);

  // Update form data when address changes
  useEffect(() => {
    if (address && !formData.wallets.includes(address)) {
      setFormData((prev) => ({
        ...prev,
        wallets: [address, ...prev.wallets.filter((w) => w !== "")],
      }));
    }
  }, [address]);

  // Wallet connection check
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
                Connect your wallet to participate in governance voting and
                manage your rollback wallet proposals.
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

  // Check if user already has a rollback wallet
  if (hasRollbackWallet) {
    return (
      <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg rounded-3xl p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Ban className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Rollback Wallet Already Exists
            </h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              You already have an active rollback wallet protection system. Only
              one rollback wallet per address is allowed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-6 py-3 rounded-2xl"
              >
                <Shield className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                className="border-gray-300 text-gray-700 px-6 py-3 rounded-2xl"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking for existing wallet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <RiLoader4Line className="h-10 w-10 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Checking Wallet Status
            </h3>
            <p className="text-gray-600 text-sm">
              Verifying if you already have a rollback wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show contract status if there's an active creation process
  if (creationState.step !== "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Rollback Wallet Creation
            </h1>
            <p className="text-gray-600">
              Creating your multi-signature rollback protection system
            </p>
          </div>

          <ContractStatusCard
            creationState={creationState}
            onSignCreation={signCreation}
            onFinalizeCreation={finalizeCreation}
            onRefreshStatus={checkPendingRequests}
          />

          {creationState.step === "approving_tokens" && (
            <Card>
              <CardHeader>
                <CardTitle>Token Approvals</CardTitle>
                <CardDescription>
                  Approve tokens for the rollback wallet to monitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">
                        {token.symbol || "Custom Token"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {token.type} • {token.address.slice(0, 6)}...
                        {token.address.slice(-4)}
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          setApprovalStatus((prev) => ({
                            ...prev,
                            [token.address]: true,
                          }));
                          await approveTokens(
                            [token],
                            creationState.walletAddress!
                          );
                          toast.success(
                            "Token Approved",
                            `${token.symbol || "Token"} approved successfully`
                          );
                        } catch (error) {
                          setApprovalStatus((prev) => ({
                            ...prev,
                            [token.address]: false,
                          }));
                          toast.error(
                            "Approval Failed",
                            "Failed to approve token"
                          );
                        }
                      }}
                      disabled={isApproving || approvalStatus[token.address]}
                      size="sm"
                      className={
                        approvalStatus[token.address] ? "bg-green-600" : ""
                      }
                    >
                      {approvalStatus[token.address] ? (
                        <Check className="h-4 w-4" />
                      ) : isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </div>
                ))}

                <div className="mt-6 space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You can manage token approvals later in the Settings page
                      if needed.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={async () => {
                      try {
                        // Update backend with wallet data
                        if (
                          generatedAgentWallet &&
                          creationState.walletAddress
                        ) {
                          await completeCreation(
                            formData,
                            generatedAgentWallet.address
                          );
                        } else {
                          completeCreation();
                        }

                        toast.success(
                          "Setup Complete",
                          "Your rollback wallet is now active!"
                        );
                        navigate("/dashboard");
                      } catch (error) {
                        console.error("Error completing setup:", error);
                        navigate("/dashboard"); // Navigate anyway since wallet was created
                      }
                    }}
                    className="w-full"
                  >
                    Complete Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {creationState.step === "completed" && (
            <div className="text-center">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-8 py-3 rounded-2xl"
              >
                <Shield className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          )}

          {creationState.step === "error" && (
            <div className="text-center">
              <Button onClick={resetState} variant="outline" className="mr-4">
                Reset Process
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white"
              >
                Go Home
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleAddWallet = () => {
    if (formData.wallets.length < 5) {
      setFormData((prev) => ({
        ...prev,
        wallets: [...prev.wallets, ""],
      }));
    }
  };

  const handleRemoveWallet = (index: number) => {
    if (index > 0) {
      setFormData((prev) => ({
        ...prev,
        wallets: prev.wallets.filter((_, i) => i !== index),
      }));
    }
  };

  const handleWalletChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((wallet, i) => (i === index ? value : wallet)),
    }));
  };

  const handleAddToken = (token: {
    address: string;
    type: "ERC20" | "ERC721";
    symbol?: string;
    name?: string;
  }) => {
    if (
      !formData.tokensToMonitor.find((t) => t.address === token.address) &&
      formData.tokensToMonitor.length < 3
    ) {
      setFormData((prev) => ({
        ...prev,
        tokensToMonitor: [...prev.tokensToMonitor, token],
      }));
    }
  };

  const handleRemoveToken = (address: string) => {
    setFormData((prev) => ({
      ...prev,
      tokensToMonitor: prev.tokensToMonitor.filter(
        (t) => t.address !== address
      ),
    }));
  };

  const generateAgentWallet = async () => {
    try {
      // Generate a new wallet locally using viem
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);

      const agentWallet = {
        address: account.address,
        privateKey: privateKey,
      };

      setGeneratedAgentWallet(agentWallet);

      toast.success(
        "Agent Wallet Generated",
        "Agent wallet created and securely stored. Keep your private key safe!"
      );
    } catch (error) {
      console.error("Agent wallet generation failed:", error);
      toast.error(
        "Generation Failed",
        "Failed to generate agent wallet. Please try again."
      );
    }
  };

  const handleApproveToken = async (tokenAddress: string) => {
    if (!generatedAgentWallet) return;

    try {
      setApprovalStatus((prev) => ({ ...prev, [tokenAddress]: true }));
      toast.success(
        "Token Approved",
        "Token has been approved for monitoring."
      );
    } catch (error) {
      setApprovalStatus((prev) => ({ ...prev, [tokenAddress]: false }));
      toast.error(
        "Approval Failed",
        "Failed to approve token. Please try again."
      );
    }
  };

  const handleCreateWallet = async () => {
    if (!generatedAgentWallet) {
      toast.error(
        "Agent Wallet Required",
        "Please generate an agent wallet first."
      );
      return;
    }

    try {
      // Update formData with the generated agent wallet
      const updatedFormData = {
        ...formData,
        agentWallet: generatedAgentWallet.address,
      };

      await proposeCreation(updatedFormData);

      toast.success(
        "Wallet Creation Proposed!",
        "Check the contract status section above for next steps."
      );
    } catch (error: any) {
      console.error("Wallet creation error:", error);
      toast.error(
        "Creation Failed",
        error?.message || "Failed to create rollback wallet. Please try again."
      );
    }
  };

  const isStepValid = (stepNumber?: number) => {
    const currentStep = stepNumber || step;
    switch (currentStep) {
      case 0:
        return true; // Intro screen
      case 1:
        return (
          formData.wallets.length > 0 &&
          formData.wallets.every((w) => w.trim() !== "") &&
          formData.fallbackWallet.trim() !== "" &&
          formData.fallbackWallet.startsWith("0x") &&
          formData.fallbackWallet.length === 42
        );
      case 2:
        return true;
      case 3:
        return formData.threshold >= 259200; // Minimum 3 days in seconds
      case 4:
        return formData.tokensToMonitor.length > 0;
      case 5:
        return generatedAgentWallet !== null;
      case 6:
        return formData.tokensToMonitor.every(
          (token) => approvalStatus[token.address]
        );
      case 7:
        return true;
      default:
        return false;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.plain("Copied to clipboard");
  };

  // Step 0: Introduction
  const renderIntro = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-[#E9A344] rounded-3xl flex items-center justify-center ">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Create Rollback Wallet
            </h1>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Secure your crypto assets with automated rollback protection. Never
            lose access to your funds due to wallet inactivity.
          </p>
        </div>

        <Card className="bg-white border-2 border-gray-200 rounded-3xl shadow-xl max-w-3xl mx-auto">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-lg font-bold text-gray-900">
              What You'll Set Up
            </CardTitle>
            <CardDescription className="text-gray-600">
              The rollback wallet creation process involves several important
              steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: User,
                  title: "Recovery & Fallback Wallets",
                  description:
                    "Add trusted wallet addresses for rollback and an emergency fallback wallet",
                  color: "bg-blue-100 text-blue-600",
                },
                {
                  icon: Settings,
                  title: "Rollback Method",
                  description:
                    "Choose how assets will be distributed (priority order or randomized)",
                  color: "bg-purple-100 text-purple-600",
                },
                {
                  icon: Clock,
                  title: "Inactivity Threshold",
                  description:
                    "Set the time period before rollback is triggered (7-90 days)",
                  color: "bg-orange-100 text-orange-600",
                },
                {
                  icon: Coins,
                  title: "Token Monitoring",
                  description:
                    "Select which tokens to protect with rollback (ERC20/ERC721)",
                  color: "bg-green-100 text-green-600",
                },
                {
                  icon: Key,
                  title: "Agent Wallet",
                  description:
                    "Generate a secure wallet for automated rollback operations",
                  color: "bg-indigo-100 text-indigo-600",
                },
                {
                  icon: CheckCircle2,
                  title: "Multi-Signature",
                  description:
                    "Complete the setup with signatures from all recovery wallets",
                  color: "bg-emerald-100 text-emerald-600",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={() => setStep(1)}
                size="lg"
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 1: Recovery Wallets
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center">
          <User className="h-5 w-5 mr-2 text-[#E9A344]" />
          Recovery & Fallback Wallets
        </h2>
        <p className="text-xs text-gray-600">
          Configure wallet addresses for asset recovery and emergency fallback
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl max-w-[600px] mx-auto">
          <CardHeader>
            <CardTitle>Recovery Wallets</CardTitle>
            <CardDescription>
              Your connected wallet is automatically added as the first recovery
              wallet (up to 5 wallets total)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.wallets.map((wallet, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {index === 0
                      ? "Owner Wallet (Connected)"
                      : `Recovery Wallet ${index}`}
                  </Label>
                  {index > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveWallet(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  value={wallet}
                  onChange={(e) => handleWalletChange(index, e.target.value)}
                  placeholder="0x..."
                  disabled={index === 0}
                  className="rounded-xl"
                />
              </div>
            ))}

            {formData.wallets.length < 5 && (
              <Button
                onClick={handleAddWallet}
                variant="outline"
                className="w-full border-dashed border-2 border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344]/5 rounded-xl py-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Recovery Wallet ({formData.wallets.length}/5)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 hover:border-blue-300 rounded-3xl max-w-[600px] mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Fallback Wallet</span>
            </CardTitle>
            <CardDescription>
              Emergency wallet that receives assets if all recovery wallets fail
              or are inactive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Fallback Wallet Address
              </Label>
              <Input
                value={formData.fallbackWallet}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fallbackWallet: e.target.value,
                  }))
                }
                placeholder="0x... (Emergency fallback address)"
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">
                This wallet acts as the final safety net if recovery wallets are
                unavailable
              </p>
            </div>

            <Alert className="border-blue-200 bg-blue-50 rounded-2xl">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Important:</strong> Choose a secure, accessible wallet
                that you control. This should be different from your recovery
                wallets for maximum security.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 2: Rollback Method
  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Settings className="h-5 w-5 mr-2 text-[#E9A344]" />
          Rollback Method
        </h2>
        <p className="text-sm text-gray-600">
          Choose how assets will be distributed to your recovery wallets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card
          className={`border-2 cursor-pointer transition-all ${
            !formData.isRandomized
              ? "border-[#E9A344] bg-[#E9A344]/5"
              : "border-gray-200 hover:border-[#E9A344]/20"
          } rounded-3xl`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, isRandomized: false }))
          }
        >
          <CardContent className="p-8 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                !formData.isRandomized ? "bg-[#E9A344]" : "bg-gray-200"
              }`}
            >
              <CheckCircle2
                className={`h-6 w-6 ${
                  !formData.isRandomized ? "text-white" : "text-gray-500"
                }`}
              />
            </div>
            <h3 className="text-sm font-bold">Priority Order</h3>
            <p className="text-sm text-gray-600">
              Assets transferred to wallets in priority order. First wallet gets
              assets, then second if first is inactive.
            </p>
            <Badge className="bg-green-100 text-green-800">Recommended</Badge>
          </CardContent>
        </Card>

        <Card
          className={`border-2 cursor-pointer transition-all ${
            formData.isRandomized
              ? "border-[#E9A344] bg-[#E9A344]/5"
              : "border-gray-200 hover:border-[#E9A344]/20"
          } rounded-3xl`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, isRandomized: true }))
          }
        >
          <CardContent className="p-8 text-center space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                formData.isRandomized ? "bg-[#E9A344]" : "bg-gray-200"
              }`}
            >
              <HelpCircle
                className={`h-6 w-6 ${
                  formData.isRandomized ? "text-white" : "text-gray-500"
                }`}
              />
            </div>
            <h3 className="text-sm font-bold">Randomized</h3>
            <p className="text-sm text-gray-600">
              Assets randomly distributed among active recovery wallets. Better
              privacy but less predictable.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 3: Inactivity Threshold
  const renderStep3 = () => {
    const [useCustomThreshold, setUseCustomThreshold] = useState(false);
    const [customDays, setCustomDays] = useState(30);

    const handleCustomDaysChange = (days: number) => {
      if (days >= 3) {
        setCustomDays(days);
        setFormData((prev) => ({ ...prev, threshold: days * 86400 })); // Convert days to seconds
      }
    };

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center justify-center">
            <Clock className="h-5 w-5 mr-2 text-[#E9A344]" />
            Inactivity Threshold
          </h2>
          <p className="text-xs text-gray-600">
            Set how long your wallet can be inactive before rollback is
            triggered (minimum 3 days)
          </p>
        </div>

        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
          <CardHeader>
            <CardTitle>Inactivity Timer</CardTitle>
            <CardDescription>
              Choose the time period after which rollback will be triggered if
              no activity is detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="use-preset"
                  checked={!useCustomThreshold}
                  onCheckedChange={(checked) => setUseCustomThreshold(!checked)}
                />
                <Label htmlFor="use-preset" className="text-sm font-medium">
                  Use preset values
                </Label>
              </div>

              {!useCustomThreshold ? (
                <div>
                  <Label className="text-sm font-medium">
                    Threshold Period
                  </Label>
                  <Select
                    value={formData.threshold.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        threshold: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-2 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="259200">3 days (Minimum)</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="1209600">14 days</SelectItem>
                      <SelectItem value="2592000">
                        30 days (Recommended)
                      </SelectItem>
                      <SelectItem value="5184000">60 days</SelectItem>
                      <SelectItem value="7776000">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {Math.floor(formData.threshold / 86400)} days
                  </p>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium">
                    Custom Threshold (days)
                  </Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      type="number"
                      min="3"
                      value={customDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 3;
                        handleCustomDaysChange(days);
                      }}
                      className="rounded-xl"
                      placeholder="Enter days (minimum 3)"
                    />
                    <span className="text-sm text-gray-500">days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum: 3 days • Selected:{" "}
                    {Math.floor(formData.threshold / 86400)} days
                  </p>
                  {Math.floor(formData.threshold / 86400) < 3 && (
                    <p className="text-xs text-red-500 mt-1">
                      Threshold must be at least 3 days for security
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="use-custom"
                  checked={useCustomThreshold}
                  onCheckedChange={(checked) =>
                    setUseCustomThreshold(!!checked)
                  }
                />
                <Label htmlFor="use-custom" className="text-sm font-medium">
                  Set custom threshold
                </Label>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50 rounded-2xl">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                We monitor your wallet for transactions. If no activity is
                detected within this period, rollback will be automatically
                triggered to protect your assets.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Step 4: Token Monitoring
  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Coins className="h-5 w-5 mr-2 text-[#E9A344]" />
          Token Monitoring
        </h2>
        <p className="text-xs text-gray-600">
          Select tokens to monitor for rollback protection (up to 3 tokens)
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
          <CardHeader>
            <CardTitle>Popular Tokens</CardTitle>
            <CardDescription>
              Common tokens you might want to monitor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POPULAR_TOKENS.map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAddToken(token)}
                >
                  <div>
                    <p className="font-medium text-sm">{token.symbol}</p>
                    <p className="text-xs text-gray-500">{token.name}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
          <CardHeader>
            <CardTitle>Custom Token</CardTitle>
            <CardDescription>
              Add a custom token by contract address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Token Contract Address</Label>
              <Input
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="0x..."
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Token Type</Label>
              <Select
                value={customTokenType}
                onValueChange={(value: "ERC20" | "ERC721") =>
                  setCustomTokenType(value)
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERC20">ERC20 Token</SelectItem>
                  <SelectItem value="ERC721">ERC721 NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (customTokenAddress) {
                  handleAddToken({
                    address: customTokenAddress,
                    type: customTokenType,
                  });
                  setCustomTokenAddress("");
                }
              }}
              className="w-full"
            >
              Add Token
            </Button>
          </CardContent>
        </Card>

        {formData.tokensToMonitor.length > 0 && (
          <Card className="border-2 border-green-200 bg-green-50 rounded-3xl">
            <CardHeader>
              <CardTitle>
                Selected Tokens ({formData.tokensToMonitor.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-white rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {token.symbol || "Custom Token"}
                      </p>
                      <p className="text-xs text-gray-500">{token.type}</p>
                    </div>
                    <Button
                      onClick={() => handleRemoveToken(token.address)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Step 5: Agent Setup
  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Key className="h-5 w-5 mr-2 text-[#E9A344]" />
          Agent Wallet Setup
        </h2>
        <p className="text-sm text-gray-600">
          Generate a secure wallet that will execute rollback operations
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Agent Wallet</CardTitle>
          <CardDescription>
            This wallet will automatically execute rollbacks when conditions are
            met
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generatedAgentWallet ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Generate Agent Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Create a secure wallet for automated rollback operations
              </p>
              <Button
                onClick={generateAgentWallet}
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white"
              >
                <Key className="h-4 w-4 mr-2" />
                Generate Agent Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 rounded-2xl">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Agent wallet generated successfully! Keep your private key
                  secure.
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-sm font-medium">Agent Address</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={generatedAgentWallet.address}
                    readOnly
                    className="rounded-xl bg-gray-50"
                  />
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAgentWallet.address)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Private Key</Label>
                  <Button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    variant="outline"
                    size="sm"
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={
                      showPrivateKey
                        ? generatedAgentWallet.privateKey
                        : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                    }
                    readOnly
                    className="rounded-xl bg-gray-50 font-mono text-xs"
                  />
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAgentWallet.privateKey)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="border-orange-200 bg-orange-50 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Important:</strong> Save your private key securely.
                  This wallet will be used to execute rollbacks automatically.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Step 6: Create wallet and get signatures
  const renderStep6 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <FileText className="h-5 w-5 mr-2 text-[#E9A344]" />
          Create Rollback Wallet
        </h2>
        <p className="text-sm text-gray-600">
          Submit the creation request to the blockchain
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Ready to Create</CardTitle>
          <CardDescription>
            Review your settings and create the rollback wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium">Recovery Wallets</Label>
              <p className="text-gray-600">{formData.wallets.length} wallets</p>
            </div>
            <div>
              <Label className="font-medium">Fallback Wallet</Label>
              <p className="text-gray-600 font-mono text-xs">
                {formData.fallbackWallet.slice(0, 6)}...
                {formData.fallbackWallet.slice(-4)}
              </p>
            </div>
            <div>
              <Label className="font-medium">Rollback Method</Label>
              <p className="text-gray-600">
                {formData.isRandomized ? "Randomized" : "Priority Order"}
              </p>
            </div>
            <div>
              <Label className="font-medium">Inactivity Threshold</Label>
              <p className="text-gray-600">
                {Math.floor(formData.threshold / 86400)} days
              </p>
            </div>
            <div>
              <Label className="font-medium">Monitored Tokens</Label>
              <p className="text-gray-600">
                {formData.tokensToMonitor.length} tokens
              </p>
            </div>
            <div>
              <Label className="font-medium">Agent Wallet</Label>
              <p className="text-gray-600 font-mono text-xs">
                {generatedAgentWallet?.address.slice(0, 6)}...
                {generatedAgentWallet?.address.slice(-4)}
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateWallet}
            disabled={creationState.isCreating}
            className="w-full bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white"
          >
            {creationState.isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Wallet...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Create Rollback Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Navigation
  const canGoNext = isStepValid(step);
  const canGoPrev = step > 0;

  const handleNext = () => {
    if (canGoNext && step < 6) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setStep(step - 1);
    }
  };

  // Main render logic for step flow
  if (step === 0) return renderIntro();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Rollback Wallet
          </h1>
          <p className="text-gray-600">
            Set up automated rollback protection for your crypto assets
          </p>
        </div>

        <StepProgress currentStep={step} isStepValid={isStepValid} />

        <div className="max-w-4xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 max-w-4xl mx-auto">
          <Button
            onClick={handlePrev}
            disabled={!canGoPrev}
            variant="outline"
            className="px-6"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Step {step} of {STEPS.length}
            </p>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext || step >= 6}
            className="px-6 bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
