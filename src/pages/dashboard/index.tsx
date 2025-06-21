"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet, useTokenPortfolio } from "@/hooks/useRollback";
import { EnhancedCharts } from "@/components/dashboard/EnhancedCharts";
import { EnhancedStatusCards } from "@/components/dashboard/EnhancedStatusCards";
import {
  DashboardLoadingSkeleton,
  CenteredLoadingState,
  WalletConnectionState,
  NoRollbackWalletState,
} from "@/components/dashboard/EnhancedLoadingStates";
import {
  EmergencyRollbackModal,
  TransactionProgressModal,
  ConfirmationModal,
} from "@/components/dashboard/EnhancedModals";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Clock,
  Settings,
  Copy,
  Bell,
  User,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  Shield,
  Coins,
  Timer,
  RefreshCw,
  Info,
  DollarSign,
  BarChart3,
  Loader2,
  WifiOff,
  Plus,
  Zap,
  ArrowRightLeft,
} from "lucide-react";

// Helper function to format token balance
const formatBalance = (balance: string, decimals: number, symbol: string) => {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return `${value.toFixed(2)} ${symbol}`;
};

// Generate activity data from user wallets
const generateActivityData = (userData: any) => {
  if (!userData?.wallets) return [];

  const activities = [];

  // Add wallet creation activity
  activities.push({
    date: userData.user?.created_at
      ? new Date(userData.user.created_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    type: "Rollback Wallet Created",
    details: "Rollback protection system initialized",
    status: "completed",
    wallet: "System",
    txHash: null,
  });

  // Add wallet status activities
  userData.wallets.forEach((wallet: any, index: number) => {
    if (wallet.is_obsolete) {
      activities.push({
        date: wallet.updated_at
          ? new Date(wallet.updated_at).toLocaleDateString()
          : new Date().toLocaleDateString(),
        type: "Wallet Marked Obsolete",
        details: `Wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(
          -4
        )} marked as obsolete`,
        status: "completed",
        wallet: wallet.address,
        txHash: null,
      });
    } else if (wallet.last_activity) {
      activities.push({
        date: new Date(wallet.last_activity).toLocaleDateString(),
        type: "Wallet Activity Detected",
        details: `Recent activity on wallet ${wallet.address.slice(
          0,
          6
        )}...${wallet.address.slice(-4)}`,
        status: "completed",
        wallet: wallet.address,
        txHash: null,
      });
    }
  });

  // Sort by date (most recent first) and limit to 4
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
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

  // Zustand store
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

  const [isEmergencyRollback, setIsEmergencyRollback] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    toast({
      title: "🔄 Data Refreshed",
      description: "Wallet data has been updated with the latest information.",
    });
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "📋 Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  const handleEmergencyRollback = async () => {
    setIsEmergencyRollback(true);
    setShowEmergencyModal(false);

    try {
      // TODO: Call actual emergency rollback API
      // await triggerEmergencyRollback(user.user.id);
      toast({
        title: "🚨 Emergency Rollback Initiated",
        description:
          "Your assets are being transferred to recovery wallets. This may take several minutes.",
        variant: "destructive",
      });

      // Refresh data after rollback
      await handleRefreshData();
    } catch (error) {
      toast({
        title: "❌ Emergency Rollback Failed",
        description:
          "Failed to initiate emergency rollback. Please contact support immediately.",
        variant: "destructive",
      });
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

  // Show error state - likely no rollback wallet exists
  if (isError) {
    return <NoRollbackWalletState onCreateWallet={() => navigate("/create")} />;
  }

  // Show no rollback wallet state
  if (hasRollbackWallet === false) {
    return <NoRollbackWalletState onCreateWallet={() => navigate("/create")} />;
  }

  // Show skeleton loading state during initial load or when dashboard is loading
  if (
    loadingStates.dashboardLoading ||
    (isLoading && !hasInitiallyLoaded) ||
    (!user && !hasInitiallyLoaded)
  ) {
    return <DashboardSkeleton />;
  }

  // Enhanced debugging
  console.log("Dashboard Debug:", {
    user,
    hasRollbackWallet,
    rollbackWalletAddress,
    isLoading,
    isError,
    isConnected,
    address,
    hasInitiallyLoaded,
    loadingStates,
  });

  // Main dashboard for users with rollback wallet
  return (
    <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-brown rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Rollback Dashboard
                </h1>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user?.rollbackConfig?.is_active
                        ? "bg-green-500"
                        : "bg-red-500"
                    } animate-pulse`}
                  />
                  <span className="text-sm">
                    {user?.rollbackConfig?.is_active
                      ? "Protection Active"
                      : "Protection Inactive"}{" "}
                    • Updated {lastRefreshTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              disabled={!user?.rollbackConfig?.is_active}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
            >
              <Zap className="h-4 w-4 mr-2" />
              Emergency Rollback
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings")}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

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

        {/* Enhanced Charts */}
        <div className="mb-8">
          <EnhancedCharts
            portfolioData={formatPortfolioData(portfolio)}
            tokenDistribution={formatTokenDistribution(portfolio)}
          />
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Configuration */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-rollback-primary" />
                Wallet Configuration
              </CardTitle>
              <CardDescription>Current rollback settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Inactivity Threshold
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {user.rollbackConfig?.inactivity_threshold || 30} days
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Rollback Method
                  </label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {user.rollbackConfig?.rollback_method || "sequential"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Agent Wallet
                </label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-mono text-gray-700">
                    {user.rollbackConfig?.agent_wallet
                      ? `${user.rollbackConfig.agent_wallet.slice(
                          0,
                          6
                        )}...${user.rollbackConfig.agent_wallet.slice(-4)}`
                      : "Not set"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyAddress(user.rollbackConfig?.agent_wallet || "")
                    }
                    className="border-gray-300"
                    disabled={!user.rollbackConfig?.agent_wallet}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Fallback Wallet
                </label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-mono text-gray-700">
                    {user.rollbackConfig?.fallback_wallet
                      ? `${user.rollbackConfig.fallback_wallet.slice(
                          0,
                          6
                        )}...${user.rollbackConfig.fallback_wallet.slice(-4)}`
                      : "Not set"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyAddress(
                        user.rollbackConfig?.fallback_wallet || ""
                      )
                    }
                    className="border-gray-300"
                    disabled={!user.rollbackConfig?.fallback_wallet}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Recovery Wallets ({user.wallets?.length || 0})
                </label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {user.wallets?.map((wallet, index) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-3 ${
                            wallet.is_obsolete ? "bg-red-500" : "bg-green-500"
                          }`}
                        ></div>
                        <p className="text-sm font-mono text-gray-700">
                          {wallet.address?.slice(0, 6)}...
                          {wallet.address?.slice(-4)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            wallet.is_obsolete ? "destructive" : "secondary"
                          }
                        >
                          {wallet.is_obsolete
                            ? "Obsolete"
                            : `Priority ${wallet.priority_position}`}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <p className="text-sm font-mono text-gray-700">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                      <Badge variant="secondary">Primary</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Monitored Tokens (
                  {user.rollbackConfig?.tokens_to_monitor?.length || 0})
                </label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {portfolioLoading ? (
                    <div className="flex items-center justify-center p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-rollback-primary" />
                      <span className="ml-2 text-sm text-gray-600">
                        Loading tokens...
                      </span>
                    </div>
                  ) : portfolio?.tokens?.length ? (
                    portfolio.tokens.map((token, index) => (
                      <div
                        key={token.address}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
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
                          <p className="text-sm font-medium text-gray-900">
                            {formatBalance(
                              token.totalBalance,
                              token.decimals,
                              token.symbol
                            )}
                          </p>
                          <p className="text-xs text-gray-600">{token.type}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        No tokens configured
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-rollback-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest wallet events and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateActivityData(user).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-2 h-2 bg-rollback-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.date}
                      </p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                      className="flex-shrink-0"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Emergency Rollback Modal */}
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
