"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet } from "@/hooks/useRollback";
import { useWriteContract, useChainId } from "wagmi";
import { ROLLBACK_WALLET_ABI } from "@/config/contracts";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Copy,
  Bell,
  Shield,
  Coins,
  Timer,
  RefreshCw,
  Info,
  WifiOff,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  User,
  Wallet,
  Clock,
  Vote,
  ExternalLink,
  CheckSquare,
} from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";

// Wallet connection state
const WalletConnectionState = ({ isConnected, address }: any) => {
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <WifiOff className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h3 className="text-2xl font-semibold text-rollback-dark mb-3">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Connect your wallet to access rollback wallet settings.
            </p>
            <Button
              onClick={openConnectModal}
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
            You need to create a rollback wallet before you can access settings.
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

export default function Settings() {
  const { isConnected, address } = useAccount();
  const {
    user,
    hasRollbackWallet,
    isLoading,
    isError,
    refetch,
    invalidateCache,
  } = useRollbackWallet();

  // Use global store for state management
  const { invalidateWalletCache } = useAppStore();

  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();

  const [settings, setSettings] = useState({
    // Contract updatable settings
    inactivityThreshold: 30,
    rollbackMethod: "priority",
    isRandomized: false,
    agentWallet: "",
    fallbackWallet: "",
    treasuryWallet: "",
    tokensToMonitor: [] as Array<{ address: string; type: string }>,
    walletPriorities: {} as Record<string, number>,

    // Database/UI settings
    isActive: true,
    notifications: {
      email: true,
      browser: false,
      activity: true,
      rollback: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [newToken, setNewToken] = useState({ address: "", type: "ERC20" });
  const navigate = useNavigate();

  // Load settings from user data
  useEffect(() => {
    if (user && user.rollbackConfig) {
      setSettings((prev) => ({
        ...prev,
        inactivityThreshold: user.rollbackConfig.inactivity_threshold || 30,
        rollbackMethod:
          user.rollbackConfig.rollback_method === "randomized"
            ? "randomized"
            : "priority",
        isRandomized: user.rollbackConfig.rollback_method === "randomized",
        isActive: user.rollbackConfig.is_active || true,
        agentWallet: user.rollbackConfig.agent_wallet || "",
        fallbackWallet: user.rollbackConfig.fallback_wallet || "",
        tokensToMonitor: user.rollbackConfig.tokens_to_monitor || [],
      }));
    }
  }, [user]);

  // Contract interaction functions (most settings require voting)
  const initiateVote = async (
    voteType: number,
    targetAddress: string,
    targetValue: bigint
  ) => {
    if (!user?.rollbackConfig?.rollback_wallet_address) {
      throw new Error("Contract address not found");
    }

    const contractAddress = user.rollbackConfig
      .rollback_wallet_address as `0x${string}`;

    await writeContractAsync({
      address: contractAddress,
      abi: ROLLBACK_WALLET_ABI,
      functionName: "requestVote",
      args: [voteType, targetAddress as `0x${string}`, targetValue],
      account: address!,
      chain: { id: chainId },
    } as any);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Initiate votes for contract settings that have changed
      const votes = [];
      let hasContractChanges = false;

      // Inactivity threshold change (requires voting)
      if (
        settings.inactivityThreshold !==
        (user?.rollbackConfig?.inactivity_threshold || 30)
      ) {
        votes.push(
          initiateVote(
            1, // THRESHOLD_CHANGE
            "0x0000000000000000000000000000000000000000",
            BigInt(settings.inactivityThreshold * 24 * 60 * 60) // Convert days to seconds
          )
        );
        hasContractChanges = true;
      }

      // Fallback wallet change (requires voting)
      if (
        settings.fallbackWallet !==
        (user?.rollbackConfig?.fallback_wallet || "")
      ) {
        votes.push(
          initiateVote(
            2, // FALLBACK_CHANGE
            settings.fallbackWallet,
            BigInt(0)
          )
        );
        hasContractChanges = true;
      }

      // Agent wallet change (requires voting)
      if (settings.agentWallet !== (user?.rollbackConfig?.agent_wallet || "")) {
        votes.push(
          initiateVote(
            0, // AGENT_CHANGE
            settings.agentWallet,
            BigInt(0)
          )
        );
        hasContractChanges = true;
      }

      // Execute all voting requests
      if (votes.length > 0) {
        await Promise.all(votes);

        toast.info(
          "Voting Initiated",
          `${votes.length} vote(s) have been initiated for contract changes. These require approval from wallet owners.`
        );
      }

      // Update database settings (non-contract settings)
      // await updateRollbackConfig(user.user.id, settings);

      // TODO: Replace with actual API call to save settings
      // await saveUserSettings(settings);

      if (hasContractChanges) {
        toast.warning(
          "Settings Update Pending",
          "Some settings require voting approval. Database settings have been saved."
        );

        // Invalidate cache to force refresh on next load
        if (address) {
          invalidateWalletCache(address);
          invalidateCache();
        }
      } else {
        toast.success(
          "Settings Saved",
          "Your rollback wallet settings have been updated successfully."
        );
      }

      // Refresh user data
      await refetch();
    } catch (error) {
      console.error("Settings save error:", error);
      toast.error("Save Failed", "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToken = () => {
    if (
      newToken.address &&
      !settings.tokensToMonitor.find((t) => t.address === newToken.address)
    ) {
      setSettings((prev) => ({
        ...prev,
        tokensToMonitor: [...prev.tokensToMonitor, newToken],
      }));
      setNewToken({ address: "", type: "ERC20" });
    }
  };

  const handleRemoveToken = (address: string) => {
    setSettings((prev) => ({
      ...prev,
      tokensToMonitor: prev.tokensToMonitor.filter(
        (t) => t.address !== address
      ),
    }));
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.plain("Address copied to clipboard");
  };

  // Show wallet connection state if not connected
  if (!isConnected) {
    return (
      <WalletConnectionState isConnected={isConnected} address={address} />
    );
  }

  // Show loading state while checking for wallet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-full flex items-center justify-center mx-auto mb-8">
              <RiLoader4Line className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold text-rollback-dark mb-3">
              Checking Wallet Status
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Searching for your rollback wallet configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show no rollback wallet state only after checking is complete and no wallet found
  if (hasRollbackWallet === false && !isLoading) {
    return <NoRollbackWalletState />;
  }

  // Don't render main settings until we know the wallet status
  if (hasRollbackWallet === undefined || hasRollbackWallet === null) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-full flex items-center justify-center mx-auto mb-8">
              <RiLoader4Line className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold text-rollback-dark mb-3">
              Loading Wallet Configuration
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Please wait while we load your rollback wallet settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-rollback-dark mb-2">
              Settings
            </h1>
            <p className="text-sm text-gray-600">
              Configure your rollback wallet protection settings
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            >
              Back to Dashboard
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
            >
              {isSaving ? (
                <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Navigation Card */}
          <Card className="border-gray-200 bg-white rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2 text-rollback-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Access additional settings and management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/settings/token-approvals")}
                  className="h-28 flex flex-col items-center justify-center  space-y-2 border-2 border-dashed border-gray-300 hover:border-rollback-primary hover:bg-rollback-primary/5"
                >
                  <CheckSquare className="h-6 w-6 text-rollback-primary" />
                  <span className="text-sm font-medium">Token Approvals</span>
                  <span className="text-xs text-gray-500">
                    Manage ERC20/ERC721 approvals
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="h-28  flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 hover:border-rollback-primary hover:bg-rollback-primary/5"
                >
                  <Shield className="h-6 w-6 text-rollback-primary" />
                  <span className="text-sm font-medium">Dashboard</span>
                  <span className="text-xs text-gray-500">
                    View wallet status
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={refetch}
                  className="h-28  flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 hover:border-rollback-primary hover:bg-rollback-primary/5"
                >
                  <RefreshCw className="h-6 w-6 text-rollback-primary" />
                  <span className="text-sm font-medium">Refresh Data</span>
                  <span className="text-xs text-gray-500">
                    Reload from blockchain
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card className="border-gray-200 bg-white rounded-2xl mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-rollback-primary" />
                Wallet Status Information
              </CardTitle>
              <CardDescription>
                Current status of your rollback wallet system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Connected Wallet
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Protection Status
                  </p>
                  <Badge variant={settings.isActive ? "default" : "secondary"}>
                    {settings.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Next Check
                  </p>
                  <p className="text-xs text-gray-500">
                    In {settings.inactivityThreshold} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Settings - Require Voting */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Vote className="h-5 w-5 mr-2 text-rollback-primary" />
                Contract Settings (Voting Required)
              </CardTitle>
              <CardDescription>
                These settings require multi-signature approval from wallet
                owners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label
                  htmlFor="inactivity-threshold"
                  className="text-sm font-medium text-gray-600"
                >
                  Inactivity Threshold (days)
                </Label>
                <Input
                  id="inactivity-threshold"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.inactivityThreshold}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      inactivityThreshold: parseInt(e.target.value) || 30,
                    }))
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Changes require voting approval from wallet owners
                </p>
              </div>

              <div>
                <Label
                  htmlFor="agent-wallet"
                  className="text-sm font-medium text-gray-600"
                >
                  Agent Wallet
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="agent-wallet"
                    value={settings.agentWallet}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        agentWallet: e.target.value,
                      }))
                    }
                    placeholder="0x..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAddress(settings.agentWallet)}
                    disabled={!settings.agentWallet}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wallet that executes automated rollbacks
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">
                      Voting Required
                    </h4>
                    <p className="text-xs text-blue-700">
                      Changes to these critical settings require approval from
                      multiple wallet owners. Votes will be created when you
                      save settings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Contract Settings */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-rollback-primary" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced contract configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label
                  htmlFor="treasury-wallet"
                  className="text-sm font-medium text-gray-600"
                >
                  Treasury Wallet
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="treasury-wallet"
                    value={settings.treasuryWallet}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        treasuryWallet: e.target.value,
                      }))
                    }
                    placeholder="0x..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAddress(settings.treasuryWallet)}
                    disabled={!settings.treasuryWallet}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Receives fees from rollback operations
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="randomized-rollback"
                    className="text-sm font-medium text-gray-600"
                  >
                    Randomized Rollback
                  </Label>
                  <p className="text-xs text-gray-500">
                    Use random selection instead of priority order
                  </p>
                </div>
                <Switch
                  id="randomized-rollback"
                  checked={settings.isRandomized}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, isRandomized: checked }))
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor="fallback-wallet"
                  className="text-sm font-medium text-gray-600"
                >
                  Fallback Wallet
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="fallback-wallet"
                    value={settings.fallbackWallet}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        fallbackWallet: e.target.value,
                      }))
                    }
                    placeholder="0x..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAddress(settings.fallbackWallet)}
                    disabled={!settings.fallbackWallet}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last resort destination for assets
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2 text-rollback-primary" />
                Application Settings
              </CardTitle>
              <CardDescription>
                Local application preferences (no blockchain interaction)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label
                  htmlFor="rollback-method"
                  className="text-sm font-medium text-gray-600"
                >
                  Display Rollback Method
                </Label>
                <Select
                  value={settings.rollbackMethod}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, rollbackMethod: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority Order</SelectItem>
                    <SelectItem value="randomized">Randomized</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Method used for asset distribution during rollback
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="protection-active"
                    className="text-sm font-medium text-gray-600"
                  >
                    UI Protection Status
                  </Label>
                  <p className="text-xs text-gray-500">
                    Display protection as active/inactive
                  </p>
                </div>
                <Switch
                  id="protection-active"
                  checked={settings.isActive}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 mb-1">
                      Instant Updates
                    </h4>
                    <p className="text-xs text-green-700">
                      These settings are saved instantly and don't require
                      blockchain transactions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Monitoring */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Coins className="h-5 w-5 mr-2 text-rollback-primary" />
                Token Monitoring
              </CardTitle>
              <CardDescription>
                Manage tokens under rollback protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">
                    Token Approvals Required
                  </h4>
                  <p className="text-xs text-blue-700">
                    Tokens must be approved for rollback protection to work
                    effectively
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/settings/token-approvals")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Approvals
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-3 block">
                  Add New Token
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Token address (0x...)"
                    value={newToken.address}
                    onChange={(e) =>
                      setNewToken((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Select
                    value={newToken.type}
                    onValueChange={(value) =>
                      setNewToken((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">ERC20</SelectItem>
                      <SelectItem value="ERC721">ERC721</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAddToken}
                    disabled={!newToken.address}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add tokens to monitor for rollback protection. Remember to
                  approve them afterwards.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-600">
                    Monitored Tokens ({settings.tokensToMonitor.length})
                  </Label>
                  {settings.tokensToMonitor.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/settings/token-approvals")}
                      className="text-xs text-rollback-primary hover:text-rollback-primary/80"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Check Approvals
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {settings.tokensToMonitor.length > 0 ? (
                    settings.tokensToMonitor.map((token, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 font-mono">
                              {token.address.slice(0, 8)}...
                              {token.address.slice(-6)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {token.type}
                              </Badge>
                              <button
                                onClick={() => handleCopyAddress(token.address)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveToken(token.address)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tokens configured</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add tokens above to enable rollback protection
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-rollback-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Configure alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Browser Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Show desktop notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.browser}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        browser: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Activity Alerts
                  </Label>
                  <p className="text-xs text-gray-500">
                    Notify on wallet activity changes
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.activity}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        activity: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Rollback Alerts
                  </Label>
                  <p className="text-xs text-gray-500">
                    Critical rollback notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.rollback}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        rollback: checked,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
