"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
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
} from "lucide-react";

// Mock data for supported tokens
const supportedTokens = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xa0b86a33e6ba",
    popular: true,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89",
    popular: true,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E552",
    popular: true,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771AF9",
    popular: true,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    address: "0x1f9840a85d5af5bf",
    popular: false,
  },
  {
    symbol: "AAVE",
    name: "Aave",
    address: "0x7Fc66500c84A76Ad",
    popular: false,
  },
  {
    symbol: "COMP",
    name: "Compound",
    address: "0xc00e94Cb662C3520",
    popular: false,
  },
  {
    symbol: "MKR",
    name: "Maker",
    address: "0x9f8F72aA9304c8B593",
    popular: false,
  },
];

// Wallet connection states
const WalletConnectionState = ({ isConnected, isConnecting }: any) => {
  const { connect } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <Loader2 className="h-14 w-14 animate-spin mx-auto mb-6 text-[#E9A344]" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
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
              onClick={connect}
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
  const { isConnected, isConnecting, address } = useWallet();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    walletName: "",
    inactivityThreshold: 30,
    rollbackMethod: "priority",
    ownerWallets: [{ address: "", priority: 1 }],
    selectedTokens: ["USDC", "DAI", "WBTC"],
    email: "",
    notifications: {
      email: true,
      warnings: true,
      rollbacks: true,
    },
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Show wallet connection state if not connected
  if (!isConnected || isConnecting) {
    return (
      <WalletConnectionState
        isConnected={isConnected}
        isConnecting={isConnecting}
      />
    );
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOwnerWalletChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const newOwnerWallets = [...formData.ownerWallets];
    newOwnerWallets[index] = { ...newOwnerWallets[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      ownerWallets: newOwnerWallets,
    }));
  };

  const addOwnerWallet = () => {
    setFormData((prev) => ({
      ...prev,
      ownerWallets: [
        ...prev.ownerWallets,
        { address: "", priority: prev.ownerWallets.length + 1 },
      ],
    }));
  };

  const removeOwnerWallet = (index: number) => {
    if (formData.ownerWallets.length > 1) {
      const newOwnerWallets = formData.ownerWallets.filter(
        (_, i) => i !== index
      );
      // Reorder priorities
      newOwnerWallets.forEach((wallet, i) => {
        wallet.priority = i + 1;
      });
      setFormData((prev) => ({
        ...prev,
        ownerWallets: newOwnerWallets,
      }));
    }
  };

  const handleTokenToggle = (tokenSymbol: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTokens: prev.selectedTokens.includes(tokenSymbol)
        ? prev.selectedTokens.filter((t) => t !== tokenSymbol)
        : [...prev.selectedTokens, tokenSymbol],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "🎉 Wallet Created Successfully!",
        description:
          "Your rollback wallet protection has been activated. You'll receive a confirmation email shortly.",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "❌ Creation Failed",
        description: "Failed to create rollback wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  const getStepProgress = () => {
    return (step / 3) * 100;
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.walletName.trim() !== "" && formData.inactivityThreshold > 0
        );
      case 2:
        return formData.ownerWallets.every(
          (wallet) => wallet.address.trim() !== ""
        );
      case 3:
        return (
          formData.selectedTokens.length > 0 && formData.email.trim() !== ""
        );
      default:
        return false;
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span>Wallet Details</span>
            </CardTitle>
            <CardDescription>
              Configure your wallet identification and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label
                htmlFor="walletName"
                className="text-sm font-medium text-gray-900"
              >
                Wallet Name
              </Label>
              <Input
                id="walletName"
                value={formData.walletName}
                onChange={(e) =>
                  handleInputChange("walletName", e.target.value)
                }
                placeholder="My Main Wallet"
                className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] hover:border-gray-400 transition-colors duration-200 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2">
                A descriptive name to identify this wallet in your dashboard
              </p>
            </div>

            <div>
              <Label
                htmlFor="threshold"
                className="text-sm font-medium text-gray-900"
              >
                Inactivity Threshold (Days)
              </Label>
              <Select
                value={formData.inactivityThreshold.toString()}
                onValueChange={(value) =>
                  handleInputChange("inactivityThreshold", parseInt(value))
                }
              >
                <SelectTrigger className="mt-2 border-gray-300 bg-white hover:bg-gray-50 focus:border-[#E9A344] transition-colors duration-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 rounded-2xl">
                  <SelectItem
                    value="7"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    7 days
                  </SelectItem>
                  <SelectItem
                    value="14"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    14 days
                  </SelectItem>
                  <SelectItem
                    value="30"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    30 days (Recommended)
                  </SelectItem>
                  <SelectItem
                    value="60"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    60 days
                  </SelectItem>
                  <SelectItem
                    value="90"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    90 days
                  </SelectItem>
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
              <Select
                value={formData.rollbackMethod}
                onValueChange={(value) =>
                  handleInputChange("rollbackMethod", value)
                }
              >
                <SelectTrigger className="mt-2 border-gray-300 bg-white hover:bg-gray-50 focus:border-[#E9A344] transition-colors duration-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300 rounded-2xl">
                  <SelectItem
                    value="priority"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    Priority Order (Recommended)
                  </SelectItem>
                  <SelectItem
                    value="randomized"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    Randomized Selection
                  </SelectItem>
                  <SelectItem
                    value="split"
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                  >
                    Split Between All
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                How assets will be distributed to your recovery wallets
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Info className="h-4 w-4 text-white" />
              </div>
              <span>Configuration Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
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
              <p className="text-xs text-gray-500">
                This wallet will be monitored for inactivity
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
                {formData.inactivityThreshold} days until rollback
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Timer resets with any wallet activity
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
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <span>Owner Wallets Configuration</span>
            </div>
            <Button
              onClick={addOwnerWallet}
              size="sm"
              className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white transition-all duration-300 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </CardTitle>
          <CardDescription>
            Add the wallet addresses that will receive your assets. Priority
            determines the order of distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.ownerWallets.map((wallet, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-2xl hover:border-[#E9A344]/50 hover:bg-gray-50 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs rounded-full">
                      Priority #{wallet.priority}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Recovery Wallet
                    </span>
                  </div>
                  {formData.ownerWallets.length > 1 && (
                    <Button
                      onClick={() => removeOwnerWallet(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label className="text-sm font-medium text-gray-900">
                      Wallet Address
                    </Label>
                    <Input
                      value={wallet.address}
                      onChange={(e) =>
                        handleOwnerWalletChange(
                          index,
                          "address",
                          e.target.value
                        )
                      }
                      placeholder="0x..."
                      className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] hover:border-gray-400 transition-colors duration-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-900">
                      Priority
                    </Label>
                    <Select
                      value={wallet.priority.toString()}
                      onValueChange={(value) =>
                        handleOwnerWalletChange(
                          index,
                          "priority",
                          parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger className="mt-2 border-gray-300 bg-white hover:bg-gray-50 focus:border-[#E9A344] transition-colors duration-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300 rounded-2xl">
                        {Array.from(
                          { length: formData.ownerWallets.length },
                          (_, i) => (
                            <SelectItem
                              key={i + 1}
                              value={(i + 1).toString()}
                              className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200 rounded-lg"
                            >
                              #{i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {wallet.address && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-800">
                        Valid address format detected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <Alert className="border-yellow-200 bg-yellow-50 rounded-2xl">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> Make sure you control all recovery
              wallets. Assets transferred during rollback cannot be reversed.
              Double-check all addresses before proceeding.
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tokens & Notifications
        </h2>
        <p className="text-gray-600">
          Choose which tokens to monitor and configure your alerts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <span>Token Selection</span>
            </CardTitle>
            <CardDescription>
              Select the ERC-20 tokens you want to include in rollback
              protection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Popular Tokens
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {supportedTokens
                    .filter((token) => token.popular)
                    .map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          checked={formData.selectedTokens.includes(
                            token.symbol
                          )}
                          onCheckedChange={() =>
                            handleTokenToggle(token.symbol)
                          }
                          className="border-gray-300 data-[state=checked]:bg-[#E9A344] data-[state=checked]:border-[#E9A344] rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {token.symbol}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {token.name}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Other Available Tokens
                </h3>
                <div className="space-y-2">
                  {supportedTokens
                    .filter((token) => !token.popular)
                    .map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded transition-colors duration-200"
                      >
                        <Checkbox
                          checked={formData.selectedTokens.includes(
                            token.symbol
                          )}
                          onCheckedChange={() =>
                            handleTokenToggle(token.symbol)
                          }
                          className="border-gray-300 data-[state=checked]:bg-[#E9A344] data-[state=checked]:border-[#E9A344] rounded-md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {token.symbol}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {token.address.slice(0, 8)}...
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">{token.name}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Selected: {formData.selectedTokens.length} tokens
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Only selected tokens will be included in rollback protection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure how you'd like to receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-900"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                className="mt-2 border-gray-300 focus:border-[#E9A344] focus:ring-[#E9A344] hover:border-gray-400 transition-colors duration-200 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send important updates about your wallet protection
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Notification Preferences
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-[#E9A344]/50 hover:bg-gray-50 transition-all duration-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Receive general updates via email
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) =>
                      handleInputChange("notifications", {
                        ...formData.notifications,
                        email: checked,
                      })
                    }
                    className="border-gray-300 data-[state=checked]:bg-[#E9A344] data-[state=checked]:border-[#E9A344] rounded-md"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-[#E9A344]/50 hover:bg-gray-50 transition-all duration-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Inactivity Warnings
                    </p>
                    <p className="text-xs text-gray-500">
                      Alert when approaching rollback threshold
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.notifications.warnings}
                    onCheckedChange={(checked) =>
                      handleInputChange("notifications", {
                        ...formData.notifications,
                        warnings: checked,
                      })
                    }
                    className="border-gray-300 data-[state=checked]:bg-[#E9A344] data-[state=checked]:border-[#E9A344] rounded-md"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-[#E9A344]/50 hover:bg-gray-50 transition-all duration-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Rollback Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Immediate alerts when rollback is executed
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.notifications.rollbacks}
                    onCheckedChange={(checked) =>
                      handleInputChange("notifications", {
                        ...formData.notifications,
                        rollbacks: checked,
                      })
                    }
                    className="border-gray-300 data-[state=checked]:bg-[#E9A344] data-[state=checked]:border-[#E9A344] rounded-md"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-0 pb-6">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Rollback Wallet
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Set up automated protection for your crypto assets. Configure
            recovery wallets, monitoring preferences, and rollback triggers.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of 3
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(getStepProgress())}% Complete
            </span>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= 1
                      ? "bg-gradient-to-br from-[#E9A344] to-[#D4941A] text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <span
                  className={`text-xs font-medium mt-2 transition-colors duration-300 ${
                    step >= 1 ? "text-[#E9A344]" : "text-gray-500"
                  }`}
                >
                  Configuration
                </span>
              </div>

              {/* Connector */}
              <div
                className={`h-1 w-16 rounded-full transition-colors duration-300 ${
                  step >= 2
                    ? "bg-gradient-to-r from-[#E9A344] to-[#D4941A]"
                    : "bg-gray-200"
                }`}
              />

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= 2
                      ? "bg-gradient-to-br from-[#E9A344] to-[#D4941A] text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <span
                  className={`text-xs font-medium mt-2 transition-colors duration-300 ${
                    step >= 2 ? "text-[#E9A344]" : "text-gray-500"
                  }`}
                >
                  Recovery Wallets
                </span>
              </div>

              {/* Connector */}
              <div
                className={`h-1 w-16 rounded-full transition-colors duration-300 ${
                  step >= 3
                    ? "bg-gradient-to-r from-[#E9A344] to-[#D4941A]"
                    : "bg-gray-200"
                }`}
              />

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= 3
                      ? "bg-gradient-to-br from-[#E9A344] to-[#D4941A] text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs font-medium mt-2 transition-colors duration-300 ${
                    step >= 3 ? "text-[#E9A344]" : "text-gray-500"
                  }`}
                >
                  Tokens & Alerts
                </span>
              </div>
            </div>
          </div>

          <Progress value={getStepProgress()} className="h-3 rounded-full" />
        </div>

        {/* Step Content */}
        <div className="mb-8 overflow-visible">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Navigation */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors duration-200 rounded-xl px-6"
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowPreviewModal(true)}
                variant="outline"
                className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-colors duration-200 rounded-xl px-6"
              >
                Preview Configuration
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white disabled:opacity-50 transition-all duration-300 rounded-xl px-6"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white disabled:opacity-50 transition-all duration-300 rounded-xl px-6"
                >
                  Create Wallet Protection
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <CustomModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Configuration Preview"
          description="Review your rollback wallet settings before creation"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet Name:</span>
                  <span className="font-medium">
                    {formData.walletName || "Unnamed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inactivity Threshold:</span>
                  <span className="font-medium">
                    {formData.inactivityThreshold} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rollback Method:</span>
                  <span className="font-medium capitalize">
                    {formData.rollbackMethod}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Recovery Wallets</h3>
              <div className="space-y-2">
                {formData.ownerWallets.map((wallet, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-gray-600">
                      Priority #{wallet.priority}:
                    </span>
                    <span className="font-mono text-xs">
                      {wallet.address
                        ? `${wallet.address.slice(
                            0,
                            10
                          )}...${wallet.address.slice(-8)}`
                        : "Not set"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Protected Tokens</h3>
              <div className="flex flex-wrap gap-2">
                {formData.selectedTokens.map((token) => (
                  <Badge key={token} variant="secondary" className="text-xs">
                    {token}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CustomModal>

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSubmit}
          title="Create Rollback Protection"
          description="Are you sure you want to create this rollback wallet configuration? This will activate monitoring for your assets."
          isLoading={isLoading}
          confirmText="Create Protection"
        />
      </div>
    </div>
  );
}
