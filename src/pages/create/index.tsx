"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useRollbackWallet,
  useCreateRollbackWallet,
  useTokenApprovals,
} from "@/hooks/useRollback";
import { CustomModal, ConfirmModal } from "@/components/CustomModal";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  WifiOff,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import type { CreateWalletFormData, AgentWallet } from "@/types/api";

// Popular tokens configuration
const POPULAR_TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86a33E6e0bC4e0C4a9A7c5b1b30e3F2d2E1F0",
    type: "ERC20" as const,
    popular: true,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    type: "ERC20" as const,
    popular: true,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5522f784C1DDDF8C0A86A81D53CC3C6",
    type: "ERC20" as const,
    popular: true,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    type: "ERC20" as const,
    popular: true,
  },
  {
    symbol: "BAYC",
    name: "Bored Ape Yacht Club",
    address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    type: "ERC721" as const,
    popular: true,
  },
];

// Wallet connection states
const WalletConnectionState = ({ isConnected }: any) => {
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <WifiOff className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Wallet Required
            </h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Connect your wallet to create and configure rollback protection
              for your crypto assets.
            </p>
            <Button
              onClick={openConnectModal}
              className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-8 py-3 text-lg rounded-2xl transition-all duration-300 transform hover:scale-105"
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

export default function CreateWallet() {
  const { isConnected, address } = useAccount();
  const {
    hasRollbackWallet,
    isLoading: checkingWallet,
    checkRollbackWallet,
  } = useRollbackWallet();
  const { createWallet, isCreating, creationStep, requestId, agentWallet } =
    useCreateRollbackWallet();
  const { approveTokens, isApproving } = useTokenApprovals();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateWalletFormData>({
    wallets: [address || ""],
    threshold: 2592000, // 30 days in seconds
    tokensToMonitor: [],
    isRandomized: false,
    fallbackWallet: "",
  });

  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenType, setCustomTokenType] = useState<"ERC20" | "ERC721">(
    "ERC20"
  );
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, boolean>>(
    {}
  );

  const { toast } = useToast();
  const navigate = useNavigate();

  // Update form data when address changes
  useEffect(() => {
    if (address && !formData.wallets.includes(address)) {
      setFormData((prev) => ({
        ...prev,
        wallets: [address, ...prev.wallets.filter((w) => w !== "")],
      }));
    }
  }, [address]);

  // Check if user already has a rollback wallet
  useEffect(() => {
    if (isConnected && address) {
      checkRollbackWallet();
    }
  }, [isConnected, address, checkRollbackWallet]);

  // Show wallet connection state if not connected
  if (!isConnected) {
    return <WalletConnectionState isConnected={isConnected} />;
  }

  // If user already has a rollback wallet, redirect
  if (hasRollbackWallet === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Rollback Wallet Already Exists
            </h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              You already have a rollback wallet configured. Visit your
              dashboard to manage it.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-8 py-3 text-lg rounded-2xl transition-all duration-300"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (checkingWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <Loader2 className="h-14 w-14 animate-spin mx-auto mb-6 text-[#E9A344]" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Checking Wallet Status
            </h3>
            <p className="text-gray-600 text-sm">
              Verifying your rollback wallet configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddWallet = () => {
    setFormData((prev) => ({
      ...prev,
      wallets: [...prev.wallets, ""],
    }));
  };

  const handleRemoveWallet = (index: number) => {
    if (formData.wallets.length > 1) {
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
  }) => {
    if (!formData.tokensToMonitor.find((t) => t.address === token.address)) {
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

  const handleAddCustomToken = () => {
    if (customTokenAddress.trim()) {
      handleAddToken({
        address: customTokenAddress.trim(),
        type: customTokenType,
      });
      setCustomTokenAddress("");
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.threshold > 0 && formData.fallbackWallet.trim() !== "";
      case 2:
        return (
          formData.wallets.every((wallet) => wallet.trim() !== "") &&
          formData.wallets.length > 0
        );
      case 3:
        return formData.tokensToMonitor.length > 0;
      default:
        return false;
    }
  };

  const handleCreateWallet = async () => {
    try {
      const result = await createWallet(formData);

      if (result && result.agentWallet) {
        toast({
          title: "🎉 Wallet Creation Proposed!",
          description: `Request ID: ${result.requestId}. ${
            result.needsSignatures
              ? `Need ${result.totalSignersNeeded - 1} more signatures.`
              : "Ready for finalization."
          }`,
        });

        setStep(4); // Move to agent creation step
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast({
        title: "❌ Creation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create rollback wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveTokens = async () => {
    if (!agentWallet) return;

    try {
      await approveTokens(formData.tokensToMonitor, agentWallet.address);

      toast({
        title: "✅ Tokens Approved",
        description: "All tokens have been approved for monitoring.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error approving tokens:", error);
      toast({
        title: "❌ Approval Failed",
        description:
          "Failed to approve tokens. You can approve them later from the dashboard.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied",
      description: "Copied to clipboard",
    });
  };

  const getStepProgress = () => {
    return (step / 4) * 100;
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Basic Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Set up the fundamental protection settings for your wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <span>Rollback Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your rollback protection parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-900">
                Inactivity Threshold
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
                <SelectTrigger className="mt-2 border-gray-300 bg-white hover:bg-gray-50 focus:border-[#E9A344] transition-colors duration-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 rounded-2xl">
                  <SelectItem value="604800">7 days</SelectItem>
                  <SelectItem value="1209600">14 days</SelectItem>
                  <SelectItem value="2592000">30 days (Recommended)</SelectItem>
                  <SelectItem value="5184000">60 days</SelectItem>
                  <SelectItem value="7776000">90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Time before rollback is triggered if no activity is detected
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900">
                Rollback Method
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority"
                    checked={!formData.isRandomized}
                    onCheckedChange={() =>
                      setFormData((prev) => ({ ...prev, isRandomized: false }))
                    }
                  />
                  <Label htmlFor="priority" className="text-sm">
                    Priority Order (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomized"
                    checked={formData.isRandomized}
                    onCheckedChange={() =>
                      setFormData((prev) => ({ ...prev, isRandomized: true }))
                    }
                  />
                  <Label htmlFor="randomized" className="text-sm">
                    Randomized Selection
                  </Label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                How assets will be distributed to your recovery wallets
              </p>
            </div>

            <div>
              <Label
                htmlFor="fallbackWallet"
                className="text-sm font-medium text-gray-900"
              >
                Fallback Wallet Address
              </Label>
              <Input
                id="fallbackWallet"
                value={formData.fallbackWallet}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fallbackWallet: e.target.value,
                  }))
                }
                placeholder="0x..."
                className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] hover:border-gray-400 transition-colors duration-200 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2">
                Final destination if all other wallets are inactive
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Info className="h-4 w-4 text-white" />
              </div>
              <span>Configuration Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Your Wallet</span>
                <Badge variant="outline" className="text-xs rounded-full">
                  Protected
                </Badge>
              </div>
              <p className="text-sm font-mono text-gray-900 mb-1">
                {address
                  ? `${address.slice(0, 10)}...${address.slice(-8)}`
                  : "Connected Wallet"}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#E9A344]/10 to-[#D4941A]/10 rounded-2xl border border-[#E9A344]/20">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-[#E9A344]" />
                <span className="text-sm font-medium text-gray-900">
                  Inactivity Timer
                </span>
              </div>
              <p className="text-sm text-gray-900">
                {Math.floor(formData.threshold / 86400)} days until rollback
              </p>
            </div>

            <Alert className="border-blue-200 bg-blue-50 rounded-2xl">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>How it works:</strong> We monitor your wallet for
                activity. If inactive for the specified period, assets are
                automatically transferred to your designated recovery wallets.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Recovery Wallets
        </h2>
        <p className="text-sm text-gray-600">
          Configure the wallets that will receive your assets during rollback
        </p>
      </div>

      <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet Addresses</span>
            <Button
              onClick={handleAddWallet}
              size="sm"
              className="bg-[#E9A344] hover:bg-[#D4941A] text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </CardTitle>
          <CardDescription>
            Add trusted wallet addresses that can receive your assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.wallets.map((wallet, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">
                  Wallet #{index + 1} {index === 0 && "(Owner)"}
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={wallet}
                    onChange={(e) => handleWalletChange(index, e.target.value)}
                    placeholder="0x..."
                    className="border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] rounded-xl"
                    disabled={index === 0} // First wallet is the owner's wallet
                  />
                  {index > 0 && (
                    <Button
                      onClick={() => handleRemoveWallet(index)}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Alert className="border-yellow-200 bg-yellow-50 rounded-2xl">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> All wallet owners must sign the
              creation transaction. Make sure you have access to all these
              wallets.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Token Monitoring
        </h2>
        <p className="text-sm text-gray-600">
          Select tokens to monitor for rollback protection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader>
            <CardTitle>Popular Tokens</CardTitle>
            <CardDescription>
              Select from commonly monitored tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {POPULAR_TOKENS.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900">{token.symbol}</p>
                    <p className="text-sm text-gray-600">{token.name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {token.type}
                  </Badge>
                </div>
                <Button
                  onClick={() =>
                    handleAddToken({ address: token.address, type: token.type })
                  }
                  size="sm"
                  variant="outline"
                  disabled={formData.tokensToMonitor.some(
                    (t) => t.address === token.address
                  )}
                  className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white rounded-xl"
                >
                  {formData.tokensToMonitor.some(
                    (t) => t.address === token.address
                  )
                    ? "Added"
                    : "Add"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader>
            <CardTitle>Custom Token</CardTitle>
            <CardDescription>
              Add any ERC20 or ERC721 token by address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-900">
                Token Address
              </Label>
              <Input
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="0x..."
                className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900">
                Token Type
              </Label>
              <Select
                value={customTokenType}
                onValueChange={(value: "ERC20" | "ERC721") =>
                  setCustomTokenType(value)
                }
              >
                <SelectTrigger className="mt-2 border-gray-300 bg-white hover:bg-gray-50 focus:border-[#E9A344] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 rounded-2xl">
                  <SelectItem value="ERC20">ERC20 (Fungible Token)</SelectItem>
                  <SelectItem value="ERC721">ERC721 (NFT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddCustomToken}
              className="w-full bg-[#E9A344] hover:bg-[#D4941A] text-white rounded-xl"
              disabled={!customTokenAddress.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Token
            </Button>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Selected Tokens
              </h3>
              <div className="space-y-2">
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-mono text-gray-900">
                        {token.address.slice(0, 10)}...{token.address.slice(-8)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {token.type}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleRemoveToken(token.address)}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.tokensToMonitor.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tokens selected yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Agent Wallet Created
        </h2>
        <p className="text-sm text-gray-600">
          Your agent wallet has been created and configured
        </p>
      </div>

      {agentWallet && (
        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span>Agent Wallet Details</span>
            </CardTitle>
            <CardDescription>
              This wallet will execute rollback operations automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-900">
                Wallet Address
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={agentWallet.address}
                  readOnly
                  className="border-gray-300 bg-gray-50 rounded-xl font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(agentWallet.address)}
                  size="sm"
                  variant="outline"
                  className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white rounded-xl"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900">
                Private Key
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={
                    showPrivateKey
                      ? agentWallet.privateKey
                      : "••••••••••••••••••••••••••••••••"
                  }
                  readOnly
                  type={showPrivateKey ? "text" : "password"}
                  className="border-gray-300 bg-gray-50 rounded-xl font-mono text-sm"
                />
                <Button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 rounded-xl"
                >
                  {showPrivateKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => copyToClipboard(agentWallet.privateKey)}
                  size="sm"
                  variant="outline"
                  className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white rounded-xl"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Alert className="border-red-200 bg-red-50 rounded-2xl mt-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Security Warning:</strong> Store this private key
                  securely. It's needed for automated rollback operations.
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Final Step: Approve Tokens
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Approve the selected tokens for monitoring by the rollback
                wallet:
              </p>

              <div className="space-y-2 mb-6">
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-mono text-gray-900">
                        {token.address.slice(0, 10)}...{token.address.slice(-8)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {token.type}
                      </Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleApproveTokens}
                disabled={isApproving}
                className="w-full bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white py-3 rounded-xl"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving Tokens...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Tokens & Complete Setup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Rollback Wallet
          </h1>
          <p className="text-gray-600">
            Set up automated asset protection for your crypto wallet
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of 4
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(getStepProgress())}%
            </span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between items-center mt-8 max-w-6xl mx-auto">
            <Button
              onClick={() => setStep(Math.max(1, step - 1))}
              variant="outline"
              disabled={step === 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              Previous
            </Button>

            {creationStep && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#E9A344]" />
                <span className="text-sm text-gray-600">{creationStep}</span>
              </div>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid()}
                className="bg-[#E9A344] hover:bg-[#D4941A] text-white rounded-xl"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreateWallet}
                disabled={!isStepValid() || isCreating}
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white rounded-xl"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Rollback Wallet"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
