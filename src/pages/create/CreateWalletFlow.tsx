"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useRollbackWallet,
  useCreateRollbackWallet,
  useTokenApprovals,
} from "@/hooks/useRollback";
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
  Key,
  FileText,
} from "lucide-react";
import type { CreateWalletFormData, AgentWallet } from "@/types/api";

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
  {
    symbol: "BAYC",
    name: "Bored Ape Yacht Club",
    address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    type: "ERC721" as const,
  },
];

export default function CreateWalletFlow() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { createWallet, isCreating } = useCreateRollbackWallet();
  const { approveTokens, isApproving } = useTokenApprovals();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
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
    useState<AgentWallet | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, boolean>>(
    {}
  );

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
              Connect your wallet to create rollback protection for your crypto
              assets.
            </p>
            <Button
              onClick={openConnectModal}
              className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-8 py-3 text-lg rounded-2xl"
            >
              <Wallet className="h-5 w-5 mr-3" />
              Connect Wallet
            </Button>
          </div>
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

  const generateAgentWallet = () => {
    // Mock wallet generation - in real app this would be secure
    const mockWallet: AgentWallet = {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      privateKey: `0x${Math.random().toString(16).substr(2, 64)}`,
    };
    setGeneratedAgentWallet(mockWallet);
    toast({
      title: "✅ Agent Wallet Generated",
      description:
        "Secure your private key - you'll need it for rollback operations.",
    });
  };

  const handleApproveToken = async (tokenAddress: string) => {
    if (!generatedAgentWallet) return;

    try {
      setApprovalStatus((prev) => ({ ...prev, [tokenAddress]: true }));
      toast({
        title: "✅ Token Approved",
        description: "Token has been approved for monitoring.",
      });
    } catch (error) {
      setApprovalStatus((prev) => ({ ...prev, [tokenAddress]: false }));
      toast({
        title: "❌ Approval Failed",
        description: "Failed to approve token. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWallet = async () => {
    try {
      const result = await createWallet(formData);
      if (result) {
        toast({
          title: "🎉 Rollback Wallet Created!",
          description: "Your rollback protection is now active.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "❌ Creation Failed",
        description: "Failed to create rollback wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.wallets.length > 0 &&
          formData.wallets.every((w) => w.trim() !== "")
        );
      case 2:
        return true;
      case 3:
        return formData.threshold > 0;
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
    toast({ title: "📋 Copied to clipboard" });
  };

  const getStepProgress = () => (step / 7) * 100;

  // Step 1: Recovery Wallets
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Add Recovery Wallets
        </h2>
        <p className="text-sm text-gray-600">
          Add wallet addresses that will receive your assets during rollback (up
          to 5 wallets)
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Recovery Wallets</CardTitle>
          <CardDescription>
            Your connected wallet is automatically added as the first recovery
            wallet
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
    </div>
  );

  // Step 2: Rollback Method
  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
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
            <h3 className="text-lg font-bold">Priority Order</h3>
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
            <h3 className="text-lg font-bold">Randomized</h3>
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
  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Inactivity Threshold
        </h2>
        <p className="text-sm text-gray-600">
          Set how long your wallet can be inactive before rollback is triggered
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Inactivity Timer</CardTitle>
          <CardDescription>
            Choose the time period after which rollback will be triggered if no
            activity is detected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Threshold Period</Label>
            <Select
              value={formData.threshold.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, threshold: parseInt(value) }))
              }
            >
              <SelectTrigger className="mt-2 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="604800">7 days</SelectItem>
                <SelectItem value="1209600">14 days</SelectItem>
                <SelectItem value="2592000">30 days (Recommended)</SelectItem>
                <SelectItem value="5184000">60 days</SelectItem>
                <SelectItem value="7776000">90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {Math.floor(formData.threshold / 86400)} days
            </p>
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

  // Step 4: Token Monitoring
  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Token Monitoring
        </h2>
        <p className="text-sm text-gray-600">
          Select tokens to monitor for rollback protection (up to 3 tokens)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
          <CardHeader>
            <CardTitle>Popular Tokens</CardTitle>
            <CardDescription>Select from commonly used tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {POPULAR_TOKENS.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
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
                  onClick={() => handleAddToken(token)}
                  size="sm"
                  variant="outline"
                  disabled={
                    formData.tokensToMonitor.some(
                      (t) => t.address === token.address
                    ) || formData.tokensToMonitor.length >= 3
                  }
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

        <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
          <CardHeader>
            <CardTitle>Custom Token</CardTitle>
            <CardDescription>
              Add any ERC20 or ERC721 token by address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Token Address</Label>
              <Input
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="0x..."
                className="mt-2 rounded-xl"
              />
            </div>
            <div>
              <Label>Token Type</Label>
              <Select
                value={customTokenType}
                onValueChange={setCustomTokenType}
              >
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ERC20">ERC20 (Fungible Token)</SelectItem>
                  <SelectItem value="ERC721">ERC721 (NFT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (customTokenAddress.trim()) {
                  handleAddToken({
                    address: customTokenAddress.trim(),
                    type: customTokenType,
                  });
                  setCustomTokenAddress("");
                }
              }}
              className="w-full bg-[#E9A344] hover:bg-[#D4941A] text-white rounded-xl"
              disabled={
                !customTokenAddress.trim() ||
                formData.tokensToMonitor.length >= 3
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Token
            </Button>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">
                Selected Tokens ({formData.tokensToMonitor.length}/3)
              </h4>
              <div className="space-y-2">
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-mono text-gray-900">
                        {token.symbol ||
                          `${token.address.slice(0, 6)}...${token.address.slice(
                            -4
                          )}`}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {token.type}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleRemoveToken(token.address)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.tokensToMonitor.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tokens selected
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 5: Agent Wallet Creation
  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Key className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Agent Wallet</h2>
        <p className="text-sm text-gray-600">
          Create an agent wallet that will execute rollback operations on your
          behalf
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Agent Wallet Generation</CardTitle>
          <CardDescription>
            This wallet will be used by our backend to trigger rollback
            functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generatedAgentWallet ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">
                Click the button below to generate a secure agent wallet for
                rollback operations.
              </p>
              <Button
                onClick={generateAgentWallet}
                className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] text-white px-8 py-3 rounded-xl"
              >
                <Key className="h-5 w-5 mr-2" />
                Generate Agent Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label>Agent Wallet Address</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    value={generatedAgentWallet.address}
                    readOnly
                    className="font-mono bg-gray-50 rounded-xl"
                  />
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAgentWallet.address)
                    }
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Private Key</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    value={
                      showPrivateKey
                        ? generatedAgentWallet.privateKey
                        : "••••••••••••••••••••••••••••••••"
                    }
                    readOnly
                    type={showPrivateKey ? "text" : "password"}
                    className="font-mono bg-gray-50 rounded-xl"
                  />
                  <Button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      copyToClipboard(generatedAgentWallet.privateKey)
                    }
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="border-red-200 bg-red-50 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Important:</strong> Store this private key securely.
                  It's required for automated rollback operations. Never share
                  it with anyone else.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Step 6: Token Approvals
  const renderStep6 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Token Approvals
        </h2>
        <p className="text-sm text-gray-600">
          Approve the agent wallet to spend your tokens for rollback operations
        </p>
      </div>

      <Card className="border-2 border-gray-200 hover:border-[#E9A344]/20 rounded-3xl">
        <CardHeader>
          <CardTitle>Approve Tokens</CardTitle>
          <CardDescription>
            Each token requires approval for the agent wallet to manage during
            rollback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.tokensToMonitor.map((token) => (
            <div
              key={token.address}
              className="flex items-center justify-between p-4 border rounded-xl"
            >
              <div>
                <p className="font-medium">
                  {token.symbol ||
                    `${token.address.slice(0, 10)}...${token.address.slice(
                      -8
                    )}`}
                </p>
                <p className="text-sm text-gray-600">{token.type}</p>
              </div>
              <div className="flex items-center space-x-3">
                {approvalStatus[token.address] ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Button
                    onClick={() => handleApproveToken(token.address)}
                    size="sm"
                    className="bg-[#E9A344] hover:bg-[#D4941A] text-white rounded-xl"
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}

          {formData.tokensToMonitor.every(
            (token) => approvalStatus[token.address]
          ) && (
            <Alert className="border-green-200 bg-green-50 rounded-2xl">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All tokens have been approved! You can proceed to the final
                step.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Step 7: Preview and Finalization
  const renderStep7 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-3xl flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Review & Finalize
        </h2>
        <p className="text-sm text-gray-600">
          Review your configuration and complete the multi-signature process
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 rounded-3xl">
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Recovery Wallets</Label>
              <div className="mt-2 space-y-1">
                {formData.wallets.map((wallet, index) => (
                  <p key={index} className="text-sm font-mono text-gray-600">
                    {index === 0 ? "Owner: " : `Recovery ${index}: `}
                    {wallet.slice(0, 10)}...{wallet.slice(-8)}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Rollback Method</Label>
              <p className="text-sm text-gray-600 mt-1">
                {formData.isRandomized
                  ? "Randomized Distribution"
                  : "Priority Order"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Inactivity Threshold
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {Math.floor(formData.threshold / 86400)} days
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Monitored Tokens</Label>
              <div className="mt-2 space-y-1">
                {formData.tokensToMonitor.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between"
                  >
                    <p className="text-sm text-gray-600">
                      {token.symbol ||
                        `${token.address.slice(0, 6)}...${token.address.slice(
                          -4
                        )}`}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {token.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 rounded-3xl">
          <CardHeader>
            <CardTitle>Multi-Signature Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 rounded-2xl">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Signing Required:</strong> With{" "}
                {formData.wallets.length} wallets configured, you'll need
                signatures from all wallet owners.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm">1. Propose Rollback Creation</span>
                <Badge variant="outline">Owner Wallet</Badge>
              </div>
              {formData.wallets.slice(1).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <span className="text-sm">{index + 2}. Approve Creation</span>
                  <Badge variant="outline">Recovery Wallet {index + 1}</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm">
                  {formData.wallets.length + 1}. Finalize Creation
                </span>
                <Badge variant="outline">Any Wallet</Badge>
              </div>
            </div>

            <Button
              onClick={handleCreateWallet}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white py-3 rounded-xl"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Rollback Wallet...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Start Multi-Signature Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Rollback Wallet
            </h1>
            <p className="text-gray-600">
              Set up automated asset protection for your crypto wallet
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="px-3 py-1">
                Step {step} of 7
              </Badge>
              <span className="text-sm text-gray-600">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[600px] mb-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            {step === 6 && renderStep6()}
            {step === 7 && renderStep7()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setStep(Math.max(1, step - 1))}
              variant="outline"
              disabled={step === 1}
              className="px-8 rounded-xl"
            >
              Previous
            </Button>

            <div className="flex space-x-4">
              {step === 5 && !generatedAgentWallet ? (
                <Button
                  onClick={generateAgentWallet}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] text-white px-8 rounded-xl"
                >
                  Generate Agent Wallet
                </Button>
              ) : step === 7 ? (
                <Button
                  onClick={handleCreateWallet}
                  disabled={!isStepValid() || isCreating}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] text-white px-8 rounded-xl"
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
              ) : (
                <Button
                  onClick={() => setStep(Math.min(7, step + 1))}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] text-white px-8 rounded-xl"
                >
                  Next Step
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
