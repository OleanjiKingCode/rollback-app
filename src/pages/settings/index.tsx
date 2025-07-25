"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useNavigate } from "react-router-dom";
import { useRollbackWallet } from "@/hooks/useRollback";
import { useDirectWalletUpdates } from "@/hooks/contracts/useWalletOperations";
import { TOKEN_TYPE } from "@/config/contracts";
import { type Address } from "viem";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Wallet,
  Shield,
  Coins,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";

export default function SettingsPage() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get rollback wallet data
  const { user, hasRollbackWallet, rollbackWalletAddress, isLoading, isError } =
    useRollbackWallet();

  // Get the wallet address (this is what we need for the direct updates)
  const walletAddress = rollbackWalletAddress;

  // Direct update hooks
  const {
    updateFallbackWallet,
    isUpdatingFallback,
    fallbackSuccess,
    updateWalletPriority,
    isUpdatingPriority,
    prioritySuccess,
    setRandomizationEnabled,
    isUpdatingRandomization,
    randomizationSuccess,
    setMonitoredTokens,
    isUpdatingTokens,
    tokensSuccess,
  } = useDirectWalletUpdates(walletAddress as Address);

  // Form states
  const [newFallback, setNewFallback] = useState("");
  const [priorityWallet, setPriorityWallet] = useState("");
  const [priorityValue, setPriorityValue] = useState("");
  const [randomizationEnabled, setRandomizationEnabledLocal] = useState(false);
  const [newTokens, setNewTokens] = useState<
    Array<{ address: string; type: "ERC20" | "ERC721" }>
  >([]);

  // Copy to clipboard handler
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  // Handle wallet connection check
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg rounded-3xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-8 text-sm">
              Connect your wallet to access rollback wallet settings.
            </p>
            <button
              onClick={openConnectModal}
              className="w-full bg-rollback-primary hover:bg-rollback-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading wallet settings...</span>
        </div>
      </div>
    );
  }

  // Handle no rollback wallet
  if (!hasRollbackWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-rollback-dark mb-3">
              No Rollback Wallet Found
            </h3>
            <p className="text-gray-600 mb-8 text-xs">
              You need to create a rollback wallet first to access settings.
            </p>
            <Button
              onClick={() => (window.location.href = "/create")}
              className="bg-rollback-primary hover:bg-rollback-primary/90"
            >
              Create Rollback Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleUpdateFallback = () => {
    if (
      !newFallback ||
      newFallback.length !== 42 ||
      !newFallback.startsWith("0x")
    ) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive",
      });
      return;
    }
    updateFallbackWallet(newFallback as Address);
  };

  const handleUpdatePriority = () => {
    if (
      !priorityWallet ||
      priorityWallet.length !== 42 ||
      !priorityWallet.startsWith("0x")
    ) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address.",
        variant: "destructive",
      });
      return;
    }

    const priority = parseInt(priorityValue);
    if (isNaN(priority) || priority < 0) {
      toast({
        title: "Invalid Priority",
        description: "Please enter a valid priority number (0 or higher).",
        variant: "destructive",
      });
      return;
    }

    updateWalletPriority(priorityWallet as Address, BigInt(priority));
  };

  const handleUpdateRandomization = () => {
    setRandomizationEnabled(randomizationEnabled);
  };

  const handleUpdateTokens = () => {
    if (newTokens.length === 0) {
      toast({
        title: "No Tokens",
        description: "Please add at least one token to monitor.",
        variant: "destructive",
      });
      return;
    }

    const addresses = newTokens.map((t) => t.address as Address);
    const types = newTokens.map((t) =>
      t.type === "ERC20" ? TOKEN_TYPE.ERC20 : TOKEN_TYPE.ERC721
    );

    setMonitoredTokens(addresses, types);
  };

  const addNewToken = () => {
    setNewTokens([...newTokens, { address: "", type: "ERC20" }]);
  };

  const removeToken = (index: number) => {
    setNewTokens(newTokens.filter((_, i) => i !== index));
  };

  const updateToken = (index: number, field: string, value: string) => {
    const updated = [...newTokens];
    updated[index] = { ...updated[index], [field]: value };
    setNewTokens(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-rollback-dark">
                Wallet Settings
              </h1>
              <p className="text-gray-600 text-sm">
                Configure your rollback wallet settings directly
              </p>
            </div>
          </div>

          {/* Current wallet info */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-rollback-primary" />
                <div>
                  <p className="font-medium text-sm">Current Rollback Wallet</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-green-700 border-green-200 bg-green-50"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Fallback Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-rollback-primary" />
                <span>Fallback Wallet</span>
              </CardTitle>
              <CardDescription>
                Set the wallet address to receive funds during rollback if no
                other active wallet is available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fallback">New Fallback Wallet Address</Label>
                <Input
                  id="fallback"
                  placeholder="0x..."
                  value={newFallback}
                  onChange={(e) => setNewFallback(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleUpdateFallback}
                disabled={isUpdatingFallback || !newFallback}
                className="w-full"
              >
                {isUpdatingFallback ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Fallback Wallet
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>
                  <strong>Current:</strong> Check wallet contract for current
                  fallback
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRight className="h-5 w-5 text-rollback-primary" />
                <span>Wallet Priority</span>
              </CardTitle>
              <CardDescription>
                Set priority for specific wallets in non-randomized mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priorityWallet">Wallet Address</Label>
                  <Input
                    id="priorityWallet"
                    placeholder="0x..."
                    value={priorityWallet}
                    onChange={(e) => setPriorityWallet(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Value</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    value={priorityValue}
                    onChange={(e) => setPriorityValue(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePriority}
                disabled={
                  isUpdatingPriority || !priorityWallet || !priorityValue
                }
                className="w-full"
              >
                {isUpdatingPriority ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Priority
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Randomization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-rollback-primary" />
                <span>Randomization</span>
              </CardTitle>
              <CardDescription>
                Enable or disable randomized wallet selection for rollbacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Randomization</Label>
                  <p className="text-xs text-gray-500">
                    When enabled, rollback target is selected randomly. When
                    disabled, uses priority order.
                  </p>
                </div>
                <Switch
                  checked={randomizationEnabled}
                  onCheckedChange={setRandomizationEnabledLocal}
                />
              </div>

              <Button
                onClick={handleUpdateRandomization}
                disabled={isUpdatingRandomization}
                className="w-full"
              >
                {isUpdatingRandomization ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Randomization
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p>
                  <strong>Current:</strong> Check wallet contract for current
                  setting
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Token Approvals Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-rollback-primary" />
                <span>Token Approvals</span>
              </CardTitle>
              <CardDescription>
                Manage token approvals for your rollback system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current monitored tokens */}
              <div className="space-y-3">
                <Label>Currently Monitored Tokens</Label>
                {user?.rollbackConfig?.tokens_to_monitor?.length > 0 ? (
                  <div className="space-y-2">
                    {user.rollbackConfig.tokens_to_monitor.map(
                      (token: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">
                                {token.symbol || `Token ${index + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {token.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-gray-600">
                                {token.address}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(token.address)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    No monitored tokens configured yet
                  </div>
                )}
              </div>

              <Separator />

              {/* Navigation to token approvals page */}
              <div className="space-y-3">
                <Label>Approval Management</Label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 text-sm mb-1">
                        Manage Token Approvals
                      </h4>
                      <p className="text-blue-700 text-xs">
                        View approval status and approve tokens for all your
                        monitored wallets
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/settings/token-approvals")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Token Approvals
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitored Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-rollback-primary" />
                <span>Monitored Tokens</span>
              </CardTitle>
              <CardDescription>
                Configure which tokens to monitor for activity tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current tokens */}
              <div className="space-y-2">
                <Label>Current Monitored Tokens</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <p className="text-gray-500 text-xs">
                    Check wallet contract for current monitored tokens
                  </p>
                </div>
              </div>

              <Separator />

              {/* New tokens */}
              <div className="space-y-2">
                <Label>Add New Tokens</Label>
                <div className="space-y-2">
                  {newTokens.map((token, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Token address (0x...)"
                        value={token.address}
                        onChange={(e) =>
                          updateToken(index, "address", e.target.value)
                        }
                        className="flex-1 font-mono text-xs"
                      />
                      <select
                        value={token.type}
                        onChange={(e) =>
                          updateToken(index, "type", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md text-xs"
                      >
                        <option value="ERC20">ERC20</option>
                        <option value="ERC721">ERC721</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeToken(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addNewToken}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Token
                </Button>
              </div>

              <Button
                onClick={handleUpdateTokens}
                disabled={isUpdatingTokens || newTokens.length === 0}
                className="w-full"
              >
                {isUpdatingTokens ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Monitored Tokens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 text-sm">
                Direct Configuration
              </h4>
              <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                These settings update your wallet configuration immediately
                without requiring votes. For critical changes like agent updates
                or emergency actions, use the governance system instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
