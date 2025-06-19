"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRollbackWallet, useTokenPortfolio } from "@/hooks/useRollback";
import { CustomModal, InfoModal } from "@/components/CustomModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

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

// Wallet connection states
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
              Connect your wallet to view your rollback protection dashboard and
              manage your secured assets.
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
            You don't have a rollback wallet yet. Create one to protect your
            assets with automated rollback capabilities when wallets become
            inactive.
          </p>

          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
            <h3 className="text-sm font-semibold text-rollback-dark mb-3">
              What is a Rollback Wallet?
            </h3>
            <ul className="text-left space-y-2 text-gray-600 text-xs">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Automatically monitors your wallet activity
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Transfers assets to backup wallets if inactive too long
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Customizable inactivity thresholds and rollback rules
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Multi-signature protection with your trusted wallets
              </li>
            </ul>
          </div>

          <Button
            onClick={() => navigate("/create")}
            className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-4 text-sm rounded-xl"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-3" />
            Create Rollback Wallet
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            The creation process involves multiple signatures from your wallet
            owners
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading State
const LoadingState = () => (
  <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
    <div className="container mx-auto px-4 py-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-6 text-rollback-primary" />
        <h3 className="text-lg font-semibold text-rollback-dark mb-3">
          Loading Dashboard
        </h3>
        <p className="text-gray-600 text-sm">
          Fetching your rollback wallet information...
        </p>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
export default function Dashboard() {
  const { isConnected, address } = useAccount();
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

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isEmergencyRollback, setIsEmergencyRollback] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for rollback wallet on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      checkRollbackWallet();
    }
  }, [isConnected, address, checkRollbackWallet]);

  // Fetch portfolio data when user is available
  useEffect(() => {
    if (user && user.rollbackConfig) {
      fetchPortfolioData();
    }
  }, [user, fetchPortfolioData]);

  const handleRefreshData = async () => {
    setLastRefresh(new Date());
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
      // Here you would call your emergency rollback API
      // await triggerEmergencyRollback(user.user.id);

      // Mock emergency rollback process
      await new Promise((resolve) => setTimeout(resolve, 3000));

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
      <WalletConnectionState isConnected={isConnected} address={address} />
    );
  }

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <AlertTriangle className="h-6 w-6 mx-auto mb-6 text-red-500" />
            <h3 className="text-lg font-semibold text-rollback-dark mb-3">
              Error Loading Dashboard
            </h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              There was an error loading your dashboard. Please try refreshing
              or check your connection.
            </p>
            <Button
              onClick={handleRefreshData}
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-3 text-sm"
            >
              <RefreshCw className="h-5 w-5 mr-3" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show no rollback wallet state
  if (hasRollbackWallet === false) {
    return <NoRollbackWalletState />;
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
  });

  // Show loading if no wallet data yet
  if (!user) {
    return <LoadingState />;
  }

  // Main dashboard for users with rollback wallet
  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-rollback-dark mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Monitor and manage your Rollback Wallets • Last updated:{" "}
              {lastRefresh.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              disabled={!user?.rollbackConfig?.is_active}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Emergency Rollback
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings")}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tokens
                  </p>
                  <p className="text-2xl font-bold text-rollback-dark">
                    {portfolio?.tokens?.length ? (
                      <div className="flex flex-col">
                        {portfolio.tokens.slice(0, 2).map((token, index) => (
                          <span key={index} className="text-sm">
                            {formatBalance(
                              token.totalBalance,
                              token.decimals,
                              token.symbol
                            )}
                          </span>
                        ))}
                        {portfolio.tokens.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{portfolio.tokens.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      "No tokens"
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Threshold Days
                  </p>
                  <p className="text-2xl font-bold text-rollback-dark">
                    {user.rollbackConfig?.inactivity_threshold || 30}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Inactivity threshold
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Timer className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monitored Tokens
                  </p>
                  <p className="text-2xl font-bold text-rollback-dark">
                    {user.rollbackConfig?.tokens_to_monitor?.length || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Active monitoring
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p
                    className={`text-2xl font-bold ${
                      user.rollbackConfig?.is_active
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {user.rollbackConfig?.is_active ? "Active" : "Inactive"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {user.rollbackConfig?.is_active
                      ? "Protection enabled"
                      : "Protection disabled"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 bg-white rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-rollback-primary" />
                  Portfolio Overview
                </CardTitle>
                <CardDescription>
                  Track your portfolio value over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolio?.chartData || []}>
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#E9A344"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#E9A344"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#E9A344"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token Distribution */}
          <div>
            <Card className="border-gray-200 bg-white rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-rollback-primary" />
                  Token Distribution
                </CardTitle>
                <CardDescription>Current allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolio?.distributionData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(portfolio?.distributionData || []).map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [
                          `$${value.toLocaleString()}`,
                          "Value",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {(portfolio?.distributionData || []).map((token, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: token.fill }}
                        ></div>
                        <span className="font-medium">{token.name}</span>
                      </div>
                      <span className="text-gray-600">{token.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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

        {/* Emergency Rollback Modal */}
        <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Rollback Warning
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                This action will immediately transfer all monitored assets from
                your current wallets to recovery wallets.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  ⚠️ Critical Warning:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This action cannot be undone</li>
                  <li>
                    • All monitored tokens will be transferred immediately
                  </li>
                  <li>• The process may take several minutes to complete</li>
                  <li>• Your wallets will be marked as compromised</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  What will happen:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Assets will be moved to your recovery wallets</li>
                  <li>• Rollback protection will remain active</li>
                  <li>
                    • You'll receive notifications about the transfer progress
                  </li>
                  <li>
                    • Transaction hashes will be provided for verification
                  </li>
                </ul>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setShowEmergencyModal(false)}
                disabled={isEmergencyRollback}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleEmergencyRollback}
                disabled={isEmergencyRollback}
                className="bg-red-600 hover:bg-red-700"
              >
                {isEmergencyRollback ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Rollback...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Confirm Emergency Rollback
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
