import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useChainId,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Droplets,
  Gift,
  Link as LinkIcon,
  Network,
  RefreshCw,
  Wallet,
  Zap,
  Star,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TEST_TOKENS, TEST_TOKEN_ABI } from "@/contracts/TestToken";
import { WalletConnectionState } from "@/components/dashboard/EnhancedLoadingStates";
import { config } from "@/config/env";

// Comprehensive faucet list matching the design
const FAUCETS = [
  {
    name: "QuickNode Base Faucet",
    url: "https://faucet.quicknode.com/base",
    description: "Multi-chain faucet with tweet bonus feature",
    network: "Base Sepolia",
    chainId: 84532,
    amount: "1 drip/12hrs",
    status: "primary",
    icon: "⚡",
  },
  {
    name: "Alchemy Base Sepolia Faucet",
    url: "https://www.alchemy.com/faucets/base-sepolia",
    description: "Reliable faucet from Alchemy infrastructure",
    network: "Base Sepolia",
    chainId: 84532,
    amount: "Daily limit",
    status: "secondary",
    icon: "🔗",
  },
  {
    name: "Chainlink Base Sepolia Faucet",
    url: "https://faucets.chain.link/base-sepolia",
    description: "Get 0.5 ETH from Chainlink's official faucet",
    network: "Base Sepolia",
    chainId: 84532,
    amount: "0.5 ETH",
    status: "bridge",
    icon: "🌐",
  },
];

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();

  const [mintAmounts, setMintAmounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<"tokens" | "eth">("tokens");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get tokens for current network
  const currentNetworkTokens =
    TEST_TOKENS[chainId as keyof typeof TEST_TOKENS] || [];

  // Get network name
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 84532:
        return "Base Sepolia";
      case 11155111:
        return "Ethereum Sepolia";
      case 1:
        return "Ethereum Mainnet";
      case 8453:
        return "Base Mainnet";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Validate mint amount
  const validateMintAmount = (amount: string, token: any) => {
    const numAmount = parseFloat(amount);
    const maxAmount = parseFloat(token.maxMintAmount || "10000");

    if (numAmount <= 0) {
      return "Amount must be greater than 0";
    }
    if (numAmount > maxAmount) {
      return `Maximum mint amount is ${maxAmount} ${token.symbol}`;
    }
    return null;
  };

  // Copy to clipboard functionality
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard!`);
      })
      .catch(() => {
        toast.error(`Failed to copy ${label}`);
      });
  };

  // Load token balances
  const loadTokenBalances = async () => {
    if (!address || !publicClient || currentNetworkTokens.length === 0) return;

    setIsRefreshing(true);
    const balances: Record<string, string> = {};

    try {
      for (const token of currentNetworkTokens) {
        try {
          const balance = (await publicClient.readContract({
            address: token.address as `0x${string}`,
            abi: TEST_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          })) as bigint;

          balances[token.address] = formatUnits(balance, token.decimals);
        } catch (error) {
          console.error(`Failed to load balance for ${token.symbol}:`, error);
          balances[token.address] = "0";
        }
      }
      setTokenBalances(balances);
    } catch (error) {
      console.error("Failed to load token balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadTokenBalances();
    }
  }, [isConnected, address, chainId]);

  // Handle test token minting
  const mintTestToken = async (token: (typeof currentNetworkTokens)[0]) => {
    if (!address || !walletClient || !publicClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amount = mintAmounts[token.address] || token.mintAmount;

    // Validate mint amount
    const validationError = validateMintAmount(amount, token);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const parsedAmount = parseUnits(amount, token.decimals);

    try {
      setIsLoading((prev) => ({ ...prev, [token.address]: true }));

      const hash = await walletClient.writeContract({
        address: token.address as `0x${string}`,
        abi: TEST_TOKEN_ABI,
        functionName: "mint",
        args: [address, parsedAmount],
        account: address,
        chain: walletClient.chain,
      });

      toast.success(`Minting ${amount} ${token.symbol}...`);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast.success(`Successfully minted ${amount} ${token.symbol}!`);
        // Refresh balance
        setTimeout(loadTokenBalances, 2000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Minting failed:", error);
      if (error.message.includes("User rejected")) {
        toast.error("Transaction was rejected");
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient ETH for gas fees");
      } else {
        toast.error(
          `Failed to mint ${token.symbol}: ${
            error.shortMessage || error.message
          }`
        );
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, [token.address]: false }));
    }
  };

  // Show wallet connection state if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-rollback-cream hero-pattern">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <div className="inline-flex items-center justify-center mb-6">
              <Star className="h-8 w-8 text-rollback-primary mr-3" />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-rollback-dark">
                  Testnet Mint
                </h1>
                <p className="text-rollback-brown text-sm">
                  Base Sepolia Testnet
                </p>
              </div>
            </div>

            <p className="text-rollback-dark max-w-2xl mx-auto mb-8 text-lg">
              Use this testnet to mint tokens and test rollback functionality
            </p>
          </div>

          {/* Connect Wallet Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/80 border-rollback-primary/20 backdrop-blur-sm shadow-xl rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-rollback-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rollback-primary/20">
                  <Wallet className="h-8 w-8 text-rollback-primary" />
                </div>
                <h2 className="text-2xl font-bold text-rollback-dark mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-rollback-brown mb-6">
                  Connect your wallet to start minting test tokens
                </p>
                <Button
                  onClick={openConnectModal}
                  className="bg-gradient-to-r from-rollback-primary to-rollback-secondary hover:from-rollback-primary/90 hover:to-rollback-secondary/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-rollback-primary/30"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rollback-light to-rollback-cream hero-pattern">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Star className="h-8 w-8 text-rollback-primary mr-3" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-rollback-dark">
                Testnet Mint
              </h1>
              <p className="text-rollback-brown text-sm">
                Base Sepolia Testnet
              </p>
            </div>
          </div>

          <p className="text-rollback-dark max-w-2xl mx-auto mb-8 text-lg">
            Use this testnet to mint tokens and test rollback functionality
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/50 rounded-2xl p-2 border border-rollback-primary/20 backdrop-blur-sm">
              <Button
                variant={activeTab === "tokens" ? "default" : "ghost"}
                onClick={() => setActiveTab("tokens")}
                className={`px-8 py-3 rounded-xl font-semibold ${
                  activeTab === "tokens"
                    ? "bg-rollback-primary text-white shadow-lg hover:bg-rollback-primary/90"
                    : "text-rollback-brown hover:text-rollback-dark hover:bg-rollback-light/30"
                }`}
              >
                <Coins className="h-5 w-5 mr-2" />
                Mint Tokens
              </Button>
              <Button
                variant={activeTab === "eth" ? "default" : "ghost"}
                onClick={() => setActiveTab("eth")}
                className={`px-8 py-3 rounded-xl font-semibold ml-2 ${
                  activeTab === "eth"
                    ? "bg-rollback-primary text-white shadow-lg hover:bg-rollback-primary/90"
                    : "text-rollback-brown hover:text-rollback-dark hover:bg-rollback-light/30"
                }`}
              >
                <Zap className="h-5 w-5 mr-2" />
                Get ETH
              </Button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "tokens" ? (
          <div className="max-w-6xl mx-auto">
            {/* Contract Addresses Section */}

            {currentNetworkTokens.length === 0 ? (
              <Card className="bg-white/80 border-rollback-primary/20 backdrop-blur-sm shadow-xl rounded-2xl">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-rollback-dark mb-2">
                    No Test Tokens Available
                  </h3>
                  <p className="text-rollback-brown">
                    No test tokens available for {getNetworkName(chainId)}. Try
                    switching to Base Sepolia or Ethereum Sepolia.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Token Address Copy Boxes */}
                <div className="mb-6 flex w-full items-center justify-center">
                  {currentNetworkTokens.map((token) => (
                    <div
                      key={token.address}
                      className="flex w-[580px] items-center justify-between p-3 bg-white/80 rounded-lg border border-gray-200 mb-2"
                    >
                      <div>
                        <span className="text-sm text-gray-600">
                          {token.symbol} Token Address:
                        </span>
                        <p className="font-mono text-sm">{token.address}</p>
                      </div>
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            token.address,
                            `${token.symbol} Address`
                          )
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-row gap-6 justify-center">
                  {currentNetworkTokens.map((token) => (
                    <Card
                      key={token.address}
                      className="flex-1 max-w-[580px] bg-white/80 border-rollback-primary/20 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-rollback-primary to-rollback-secondary rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">
                                {token.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-rollback-dark">
                                {token.name}
                              </h3>
                              <p className="text-rollback-brown">
                                {token.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-rollback-brown">
                              Balance
                            </p>
                            <p className="text-lg font-semibold text-rollback-dark">
                              {tokenBalances[token.address] || "0"}{" "}
                              {token.symbol}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder={`Amount (max: ${
                              token.maxMintAmount || "10000"
                            })`}
                            value={mintAmounts[token.address] || ""}
                            onChange={(e) =>
                              setMintAmounts((prev) => ({
                                ...prev,
                                [token.address]: e.target.value,
                              }))
                            }
                            className="bg-rollback-light/50 border-rollback-primary/30 text-rollback-dark placeholder-rollback-brown focus:border-rollback-primary rounded-xl"
                            max={token.maxMintAmount || "10000"}
                            min="0.001"
                          />
                          <div className="text-xs text-rollback-brown mb-2">
                            Default: {token.mintAmount} • Max:{" "}
                            {token.maxMintAmount || "10000"} {token.symbol}
                          </div>
                          <Button
                            onClick={() => mintTestToken(token)}
                            disabled={isLoading[token.address]}
                            className="w-full bg-gradient-to-r from-rollback-primary to-rollback-secondary hover:from-rollback-primary/90 hover:to-rollback-secondary/90 text-white font-semibold py-3 shadow-lg hover:shadow-rollback-primary/30 rounded-xl"
                          >
                            {isLoading[token.address] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Minting...
                              </>
                            ) : (
                              <>
                                <Gift className="h-4 w-4 mr-2" />
                                Mint {token.symbol}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-rollback-brown">
                Use these faucets to get ETH for gas fees on Base Sepolia
              </p>
            </div>

            {/* All 3 faucets in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FAUCETS.map((faucet, index) => (
                <Card
                  key={index}
                  className="bg-white/80 border-rollback-primary/20 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-2xl">{faucet.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-rollback-dark mb-1">
                          {faucet.name}
                        </h3>
                        <p className="text-rollback-brown text-sm mb-2">
                          {faucet.description}
                        </p>
                        <Badge
                          className={`${
                            faucet.status === "primary"
                              ? "bg-green-500/20 text-green-700 border-green-400/30"
                              : faucet.status === "secondary"
                              ? "bg-blue-500/20 text-blue-700 border-blue-400/30"
                              : "bg-rollback-primary/20 text-rollback-primary border-rollback-primary/30"
                          }`}
                        >
                          {faucet.amount}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(faucet.url, "_blank")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-green-600/30 rounded-xl"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Faucet →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
