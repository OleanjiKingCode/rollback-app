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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Coins,
  WifiOff,
  Plus,
  Trash2,
  User,
  Wallet,
  CheckSquare,
  ArrowLeft,
  Shield,
  Unlink,
} from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";

// Wallet connection state
const WalletConnectionState = ({ isConnected, address }: any) => {
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
              <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Unlink className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>

              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Connect your wallet to access rollback wallet settings.
              </p>

              <button
                onClick={openConnectModal}
                className="bg-gradient-to-r from-rollback-primary to-rollback-primary/90 hover:from-rollback-primary/90 hover:to-rollback-primary text-white px-4 py-2 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Connect Wallet</span>
              </button>
            </div>
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
  const { user, hasRollbackWallet, isLoading } = useRollbackWallet();

  const [tokensToMonitor, setTokensToMonitor] = useState<
    Array<{ address: string; type: string }>
  >([]);
  const [newToken, setNewToken] = useState({ address: "", type: "ERC20" });
  const navigate = useNavigate();

  // Load tokens from user data
  useEffect(() => {
    if (user && user.rollbackConfig) {
      setTokensToMonitor(user.rollbackConfig.tokens_to_monitor || []);
    }
  }, [user]);

  const handleAddToken = () => {
    if (
      newToken.address &&
      !tokensToMonitor.find((t) => t.address === newToken.address)
    ) {
      setTokensToMonitor([...tokensToMonitor, newToken]);
      setNewToken({ address: "", type: "ERC20" });
      toast.success("Token Added", "Token has been added to monitoring list.");
    }
  };

  const handleRemoveToken = (address: string) => {
    setTokensToMonitor(tokensToMonitor.filter((t) => t.address !== address));
    toast.success(
      "Token Removed",
      "Token has been removed from monitoring list."
    );
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
              Manage your token approvals and rollback wallet settings
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Access to Token Approvals */}
          <Card className="border-gray-200 bg-white rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-rollback-primary" />
                Token Approvals Management
              </CardTitle>
              <CardDescription>
                Essential tool for managing your rollback wallet protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">
                    Manage Token Approvals
                  </h4>
                  <p className="text-sm text-blue-700">
                    View and manage ERC20/ERC721 token approvals for your
                    rollback wallet. This is the most important setting for
                    ensuring your protection works correctly.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/settings/token-approvals")}
                  className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-6 py-3"
                >
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Open Token Approvals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Token Monitoring */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Coins className="h-5 w-5 mr-2 text-rollback-primary" />
                Monitored Tokens
              </CardTitle>
              <CardDescription>
                Tokens currently under rollback protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    Monitored Tokens ({tokensToMonitor.length})
                  </Label>
                  {tokensToMonitor.length > 0 && (
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
                  {tokensToMonitor.length > 0 ? (
                    tokensToMonitor.map((token, index) => (
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
        </div>
      </div>
    </div>
  );
}
