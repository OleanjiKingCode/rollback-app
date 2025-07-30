import React, { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { WalletConnectionState } from "@/components/dashboard/EnhancedLoadingStates";

// Comprehensive faucet list
const FAUCETS = [
  {
    name: "Base Sepolia Faucet",
    url: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
    description: "Official Coinbase faucet for Base Sepolia testnet",
    network: "Base Sepolia",
    chainId: 84532,
    amount: "0.05 ETH",
    cooldown: "24 hours",
    requirements: "Coinbase account",
    status: "active",
  },
  {
    name: "Ethereum Sepolia Faucet",
    url: "https://sepoliafaucet.com/",
    description: "Alchemy-powered Sepolia faucet",
    network: "Ethereum Sepolia",
    chainId: 11155111,
    amount: "0.5 ETH",
    cooldown: "24 hours",
    requirements: "Alchemy account",
    status: "active",
  },
  {
    name: "QuickNode Faucet",
    url: "https://faucet.quicknode.com/ethereum/sepolia",
    description: "QuickNode multi-network faucet",
    network: "Ethereum Sepolia",
    chainId: 11155111,
    amount: "0.1 ETH",
    cooldown: "12 hours",
    requirements: "Twitter/Discord",
    status: "active",
  },
  {
    name: "Infura Faucet",
    url: "https://www.infura.io/faucet/sepolia",
    description: "Infura Sepolia faucet",
    network: "Ethereum Sepolia",
    chainId: 11155111,
    amount: "0.5 ETH",
    cooldown: "24 hours",
    requirements: "Infura account",
    status: "active",
  },
  {
    name: "Base Bridge",
    url: "https://bridge.base.org/",
    description: "Bridge ETH from Ethereum to Base",
    network: "Base Sepolia",
    chainId: 84532,
    amount: "Variable",
    cooldown: "None",
    requirements: "Sepolia ETH",
    status: "bridge",
  },
  {
    name: "Paradigm Faucet",
    url: "https://faucet.paradigm.xyz/",
    description: "Multi-network faucet by Paradigm",
    network: "Multiple",
    chainId: null,
    amount: "Variable",
    cooldown: "24 hours",
    requirements: "Twitter",
    status: "active",
  },
];

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refetchBalance();
      toast.success("Balance refreshed!");
    } catch (error) {
      toast.error("Failed to refresh balance");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show wallet connection state if not connected
  if (!isConnected) {
    return (
      <WalletConnectionState
        isConnected={isConnected}
        address={address}
        onConnect={openConnectModal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💧 Testnet ETH Faucets
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get free testnet ETH for development and testing. All ETH from these
            faucets is for testing only and has no real value.
          </p>
        </div>

        {/* Wallet Info */}
        {isConnected && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Address:</span>
                  <Badge variant="outline" className="font-mono">
                    {formatAddress(address!)}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <Badge variant="outline">
                    {balance
                      ? `${parseFloat(formatEther(balance.value)).toFixed(
                          4
                        )} ETH`
                      : "0 ETH"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Network:</span>
                  <Badge>{balance?.symbol || "Unknown"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Alert className="mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use faucets:</strong> Most faucets require social
            verification (Twitter, Discord) to prevent abuse. Have your wallet
            address ready and follow each faucet's specific requirements.
          </AlertDescription>
        </Alert>

        {/* Faucets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FAUCETS.map((faucet, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{faucet.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {faucet.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      faucet.status === "active"
                        ? "default"
                        : faucet.status === "bridge"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {faucet.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Network:</span>
                    <Badge variant="outline">{faucet.network}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-green-600">
                      {faucet.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Cooldown:</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {faucet.cooldown}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Requirements:</span>
                    <span className="text-xs">{faucet.requirements}</span>
                  </div>
                </div>

                <Button
                  onClick={() => window.open(faucet.url, "_blank")}
                  className="w-full"
                  variant={faucet.status === "bridge" ? "secondary" : "default"}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {faucet.status === "bridge" ? "Open Bridge" : "Visit Faucet"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Verify your social accounts</h4>
                  <p className="text-sm text-gray-600">
                    Most faucets require Twitter or Discord verification
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Wait for cooldown periods</h4>
                  <p className="text-sm text-gray-600">
                    Respect the waiting time between requests
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Use multiple faucets</h4>
                  <p className="text-sm text-gray-600">
                    Different faucets have different limits and requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚠️ Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Testnet ETH only</h4>
                  <p className="text-sm text-gray-600">
                    This ETH has no real value and cannot be sold
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Network verification</h4>
                  <p className="text-sm text-gray-600">
                    Always verify you're on the correct testnet
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Be patient</h4>
                  <p className="text-sm text-gray-600">
                    Transactions may take a few minutes to appear
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Warning */}
        <Alert className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Remember:</strong> Testnet ETH is for development and
            testing only. Never send real ETH to testnet addresses or use
            testnet private keys on mainnet.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
