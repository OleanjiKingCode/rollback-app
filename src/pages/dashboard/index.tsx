"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useRollbackWallet,
  useTokenPortfolio,
  useApprovalWarningStatus,
} from "@/hooks/useRollback";
import { EnhancedCharts } from "@/components/dashboard/EnhancedCharts";
import { EnhancedStatusCards } from "@/components/dashboard/EnhancedStatusCards";
import {
  WalletConnectionState,
  NoRollbackWalletState,
} from "@/components/dashboard/EnhancedLoadingStates";
import { EmergencyRollbackModal } from "@/components/dashboard/EnhancedModals";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ApprovalWarningBanner } from "@/components/dashboard/ApprovalWarningBanner";
import { useAppStore } from "@/stores/appStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Settings,
  Copy,
  Shield,
  RefreshCw,
  Zap,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";

// Helper function to format token balance
const formatBalance = (balance: string, decimals: number, symbol: string) => {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return `${value.toFixed(2)} ${symbol}`;
};

// Helper function to calculate total portfolio value from real tokens
const calculatePortfolioValue = (portfolio: any) => {
  if (!portfolio?.tokens?.length) return 0;

  return portfolio.tokens.reduce((total: number, token: any) => {
    const balance =
      parseFloat(token.totalBalance) / Math.pow(10, token.decimals);
    // Using actual token balance - multiply by token price when API is available
    return total + balance;
  }, 0);
};

// Helper function to format portfolio data for charts using real token data
const formatPortfolioData = (portfolio: any) => {
  if (!portfolio?.tokens?.length) return [];

  // Use only current token balance data - no historical simulation
  const currentValue = calculatePortfolioValue(portfolio);

  // Return single data point with current value only
  return [
    {
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: Math.round(currentValue * 100) / 100,
      volume: 0, // No volume data available
    },
  ];
};

const formatTokenDistribution = (portfolio: any) => {
  if (!portfolio?.tokens?.length) return [];

  const colors = ["#E9A344", "#F5C678", "#8B5E3C", "#FAEBD1", "#3C2415"];
  const total = portfolio.tokens.reduce((sum: number, token: any) => {
    const balance =
      parseFloat(token.totalBalance) / Math.pow(10, token.decimals);
    return sum + balance; // Use actual token balance, not mock USD
  }, 0);

  return portfolio.tokens.map((token: any, index: number) => {
    const balance =
      parseFloat(token.totalBalance) / Math.pow(10, token.decimals);
    const percentage = total > 0 ? (balance / total) * 100 : 0;

    return {
      name: token.symbol,
      value: Math.round(balance * 100) / 100, // Real token balance
      percentage: Math.round(percentage),
      color: colors[index % colors.length],
    };
  });
};

// Main Dashboard Component
export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const navigate = useNavigate();
  const [isEmergencyRollback, setIsEmergencyRollback] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const {
    loadingStates,
    setLoading,
    currentUser,
    setCurrentUser,
    hasInitiallyLoaded,
    setHasInitiallyLoaded,
    lastRefreshTime,
    setLastRefreshTime,
  } = useAppStore();

  const {
    user,
    hasRollbackWallet,
    rollbackWalletAddress,
    isLoading,
    isError,
    checkRollbackWallet,
    refetch,
  } = useRollbackWallet();

  const {
    portfolio,
    isLoading: portfolioLoading,
    error: portfolioError,
    fetchPortfolioData,
  } = useTokenPortfolio(user);

  // Check approval status for warning banner
  const approvalWarning = useApprovalWarningStatus(user);

  // Deduplicate wallets by address (case-insensitive)
  const deduplicatedWallets =
    user?.wallets?.reduce((unique, wallet) => {
      const existingWallet = unique.find(
        (w) => w.address?.toLowerCase() === wallet.address?.toLowerCase()
      );
      if (!existingWallet) {
        unique.push(wallet);
      }
      return unique;
    }, [] as typeof user.wallets) || [];

  // Check for rollback wallet on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      setLoading("userLoading", true);
      checkRollbackWallet().finally(() => {
        setLoading("userLoading", false);
      });
    }
  }, [isConnected, address, checkRollbackWallet, setLoading]);

  // Fetch portfolio data when user is available
  useEffect(() => {
    if (user && user.rollbackConfig) {
      setLoading("portfolioLoading", true);
      fetchPortfolioData().finally(() => {
        setLoading("portfolioLoading", false);
      });
    }
  }, [user, fetchPortfolioData, setLoading]);

  // Update current user in store
  useEffect(() => {
    setCurrentUser(user);
  }, [user, setCurrentUser]);

  // Track when we've initially loaded to avoid showing loading on subsequent fetches
  useEffect(() => {
    if (
      !isLoading &&
      (user !== undefined || isError || hasRollbackWallet !== undefined)
    ) {
      setHasInitiallyLoaded(true);
      setLoading("dashboardLoading", false);
    }
  }, [
    isLoading,
    user,
    isError,
    hasRollbackWallet,
    setHasInitiallyLoaded,
    setLoading,
  ]);

  // Set dashboard loading on initial load
  useEffect(() => {
    if (!hasInitiallyLoaded && isConnected) {
      setLoading("dashboardLoading", true);
    }
  }, [isConnected, hasInitiallyLoaded, setLoading]);

  const handleRefreshData = async () => {
    setLastRefreshTime(new Date());
    await checkRollbackWallet();
    await refetch();
    await fetchPortfolioData();
    toast.success(
      "Data Refreshed",
      "Wallet data has been updated with the latest information."
    );
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.plain("Address copied to clipboard");
  };

  const handleEmergencyRollback = async () => {
    setIsEmergencyRollback(true);
    setShowEmergencyModal(false);

    try {
      // TODO: Call actual emergency rollback API
      // await triggerEmergencyRollback(user.user.id);
      toast.warning(
        "Emergency Rollback Initiated",
        "Your assets are being transferred to recovery wallets. This may take several minutes."
      );

      // Refresh data after rollback
      await handleRefreshData();
    } catch (error) {
      toast.error(
        "Emergency Rollback Failed",
        "Failed to initiate emergency rollback. Please contact support immediately."
      );
    } finally {
      setIsEmergencyRollback(false);
    }
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

  // Show error state - only if loading is complete and there's a definitive error
  if (isError && !isLoading && hasInitiallyLoaded) {
    return <NoRollbackWalletState onCreateWallet={() => navigate("/create")} />;
  }

  // Show no rollback wallet state - only after checking is complete and no wallet found
  if (hasRollbackWallet === false && !isLoading && hasInitiallyLoaded) {
    return <NoRollbackWalletState onCreateWallet={() => navigate("/create")} />;
  }

  // Show skeleton loading state during initial load, when dashboard is loading, or when wallet status is unknown
  if (
    loadingStates.dashboardLoading ||
    (isLoading && !hasInitiallyLoaded) ||
    (!user && !hasInitiallyLoaded) ||
    hasRollbackWallet === undefined
  ) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 relative">
      {/* Floating Approval Warning Icon */}
      <ApprovalWarningBanner
        showWarning={approvalWarning.showWarning}
        unapprovedCount={approvalWarning.unapprovedCount}
        totalTokens={approvalWarning.totalTokens}
        unapprovedTokens={approvalWarning.unapprovedTokens}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Rollback Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshData}
              variant="outline"
              className="flex items-center gap-2"
              disabled={
                loadingStates.userLoading || loadingStates.portfolioLoading
              }
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingStates.userLoading || loadingStates.portfolioLoading
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setShowEmergencyModal(true)}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={isEmergencyRollback}
            >
              {isEmergencyRollback ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Emergency Rollback
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Rest of the existing dashboard content */}

        {/* Enhanced Status Cards */}
        <div className="mb-8">
          <EnhancedStatusCards
            thresholdDays={user?.rollbackConfig?.inactivity_threshold || 30}
            monitoredTokens={
              user?.rollbackConfig?.tokens_to_monitor?.length || 0
            }
            status={user?.rollbackConfig?.is_active ? "active" : "inactive"}
            portfolio={{
              totalValue: calculatePortfolioValue(portfolio),
              change24h: 0, // TODO: Calculate from real historical data when available
              isPositive: false,
            }}
            isLoading={loadingStates.portfolioLoading || portfolioLoading}
          />
        </div>

        {/* Wallet Details */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Wallets Card */}
            <Card className="border-gray-200 bg-white rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-rollback-primary" />
                  Recovery Wallets
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  All wallets configured for asset recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-between gap-4 h-[420px]">
                {/* Recovery Sequence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Recovery Sequence ({deduplicatedWallets.length})
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Priority Order
                    </Badge>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {deduplicatedWallets.map((wallet, index) => (
                        <div
                          key={wallet.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-semibold ${
                                wallet.is_obsolete
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {wallet.address?.slice(0, 6)}...
                                {wallet.address?.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {wallet.is_obsolete
                                  ? "Marked as obsolete"
                                  : "Active recovery wallet"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              wallet.is_obsolete ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {wallet.is_obsolete ? "Obsolete" : "Active"}
                          </Badge>
                        </div>
                      ))}

                      {/* Show connected wallet as fallback only if no wallets found */}
                      {deduplicatedWallets.length === 0 && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold">
                              1
                            </div>
                            <div>
                              <p className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Primary connected wallet
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Primary
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Protected Assets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Protected Assets (
                      {user.rollbackConfig?.tokens_to_monitor?.length || 0})
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Under Protection
                    </Badge>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {portfolioLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <RiLoader4Line className="h-4 w-4 animate-spin text-rollback-primary mr-2" />
                          <span className="text-gray-600 text-sm">
                            Loading assets...
                          </span>
                        </div>
                      ) : portfolio?.tokens?.length ? (
                        portfolio.tokens.map((token, index) => (
                          <div
                            key={token.address}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {token.symbol.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {token.symbol}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {token.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatBalance(
                                  token.totalBalance,
                                  token.decimals,
                                  token.symbol
                                )}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {token.type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                            <Wallet className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-gray-600 text-sm font-medium">
                            No tokens configured
                          </p>
                          <p className="text-xs text-gray-500">
                            Add tokens to enable protection
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Details Card */}
            <Card className="border-gray-200 bg-white rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-rollback-primary" />
                  Wallet Details
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  Rollback method and critical wallet addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-between gap-4 h-[420px]">
                {/* Rollback Method */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-2 border border-green-200">
                  <div className="flex items-center mb-2">
                    <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <ArrowRightLeft className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Rollback Method
                      </h4>
                      <p className="text-xs text-gray-600">
                        Recovery execution order
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-700 capitalize">
                    {user.rollbackConfig?.rollback_method || "sequential"}
                  </p>
                </div>

                {/* Agent Wallet */}
                <div className="bg-amber-50 rounded-xl p-2 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-amber-900">
                      Agent Wallet
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 text-xs"
                    >
                      Primary
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-amber-800 bg-amber-100 px-3 py-2 rounded-lg">
                      {user.rollbackConfig?.agent_wallet
                        ? `${user.rollbackConfig.agent_wallet.slice(
                            0,
                            6
                          )}...${user.rollbackConfig.agent_wallet.slice(-4)}`
                        : "Not configured"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyAddress(
                          user.rollbackConfig?.agent_wallet || ""
                        )
                      }
                      className="border-amber-300 hover:bg-amber-100"
                      disabled={!user.rollbackConfig?.agent_wallet}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Fallback Wallet */}
                <div className="bg-purple-50 rounded-xl p-2 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-purple-900">
                      Fallback Wallet
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 text-xs"
                    >
                      Backup
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-purple-800 bg-purple-100 px-2 py-2 rounded-lg">
                      {user.rollbackConfig?.fallback_wallet
                        ? `${user.rollbackConfig.fallback_wallet.slice(
                            0,
                            6
                          )}...${user.rollbackConfig.fallback_wallet.slice(-4)}`
                        : "Not configured"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyAddress(
                          user.rollbackConfig?.fallback_wallet || ""
                        )
                      }
                      className="border-purple-300 hover:bg-purple-100"
                      disabled={!user.rollbackConfig?.fallback_wallet}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Inactivity Threshold */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-2 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Inactivity Threshold
                      </h4>
                      <p className="text-xs text-gray-600">
                        Days until rollback triggers
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-700">
                    {user.rollbackConfig?.inactivity_threshold || 30} days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8">
          <EnhancedCharts
            portfolioData={formatPortfolioData(portfolio)}
            tokenDistribution={formatTokenDistribution(portfolio)}
          />
        </div>

        <EmergencyRollbackModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          onConfirm={handleEmergencyRollback}
          isLoading={isEmergencyRollback}
        />
      </div>
    </div>
  );
}
