"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { CustomModal, InfoModal } from "@/components/CustomModal";
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

// Enhanced mock data - removed ETH references
const mockWallets = [
  {
    id: "1",
    address: "0x1234567890123456789012345678901234567890",
    status: "active",
    threshold: 30,
    daysRemaining: 3,
    totalValue: "125,500 USDC",
    totalValueUSD: 125500,
    agentWallet: "0xabcd...efgh",
    lastActivity: "2024-01-20T10:30:00Z",
    rollbackMethod: "priority",
    ownerWallets: [
      { address: "0x1111...1111", priority: 1, status: "active" },
      { address: "0x2222...2222", priority: 2, status: "active" },
      { address: "0x3333...3333", priority: 3, status: "inactive" },
    ],
    monitoredTokens: ["USDC", "DAI", "WBTC"],
    warningsSent: 2,
    email: "user@example.com",
  },
  {
    id: "2",
    address: "0x0987654321098765432109876543210987654321",
    status: "warning",
    threshold: 60,
    daysRemaining: 4,
    totalValue: "89,200 USDC",
    totalValueUSD: 89200,
    agentWallet: "0x1234...5678",
    lastActivity: "2024-01-15T14:20:00Z",
    rollbackMethod: "randomized",
    ownerWallets: [
      { address: "0x4444...4444", priority: 1, status: "active" },
      { address: "0x5555...5555", priority: 2, status: "active" },
    ],
    monitoredTokens: ["USDC", "WBTC", "LINK"],
    warningsSent: 1,
    email: "user2@example.com",
  },
];

const mockTokens = [
  {
    symbol: "USDC",
    balance: "75,000",
    value: "$75,000",
    address: "0xa0b86a33e6ba",
    valueNum: 75000,
    change24h: 0.1,
  },
  {
    symbol: "DAI",
    balance: "25,000",
    value: "$25,000",
    address: "0x6B175474E89",
    valueNum: 25000,
    change24h: -0.2,
  },
  {
    symbol: "WBTC",
    balance: "1.5",
    value: "$60,000",
    address: "0x2260FAC5E552",
    valueNum: 60000,
    change24h: 1.8,
  },
  {
    symbol: "LINK",
    balance: "2,500",
    value: "$40,000",
    address: "0x514910771AF9",
    valueNum: 40000,
    change24h: 3.2,
  },
];

const mockActivity = [
  {
    date: "2024-01-20",
    type: "Activity Reset",
    details: "Manual reset by user",
    status: "completed",
    wallet: "0x1234...7890",
    txHash: "0xabc123...",
  },
  {
    date: "2024-01-19",
    type: "Warning Sent",
    details: "Email warning sent - 3 days remaining",
    status: "completed",
    wallet: "0x1234...7890",
    txHash: null,
  },
  {
    date: "2024-01-15",
    type: "Config Update",
    details: "Updated inactivity threshold to 30 days",
    status: "completed",
    wallet: "0x1234...7890",
    txHash: "0xdef456...",
  },
  {
    date: "2024-01-10",
    type: "Token Added",
    details: "Added LINK to monitoring list",
    status: "completed",
    wallet: "0x1234...7890",
    txHash: "0x789abc...",
  },
];

const portfolioData = [
  { date: "Jan 1", value: 150000, tokens: 4 },
  { date: "Jan 8", value: 165000, tokens: 4 },
  { date: "Jan 15", value: 180000, tokens: 5 },
  { date: "Jan 22", value: 200000, tokens: 5 },
  { date: "Jan 29", value: 185000, tokens: 4 },
];

const tokenDistribution = [
  { name: "USDC", value: 75000, fill: "#E9A344", percentage: 37.5 },
  { name: "WBTC", value: 60000, fill: "#F5C678", percentage: 30.0 },
  { name: "LINK", value: 40000, fill: "#8B5E3C", percentage: 20.0 },
  { name: "DAI", value: 25000, fill: "#FAEBD1", percentage: 12.5 },
];

// Wallet connection states
const WalletConnectionState = ({ isConnected, isConnecting, address }: any) => {
  const { connect } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-rollback-primary" />
            <h3 className="text-2xl font-semibold text-rollback-dark mb-3">
              Connecting Wallet
            </h3>
            <p className="text-gray-600 text-lg">
              Please approve the connection in your wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 flex items-center justify-center">
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
              onClick={connect}
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

export default function Dashboard() {
  const { isConnected, isConnecting, address } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState(mockWallets[0]);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetActivity = () => {
    toast({
      title: "🔄 Activity Reset",
      description:
        "Your activity timer has been reset successfully. You'll receive a confirmation email shortly.",
    });

    setSelectedWallet((prev) => ({
      ...prev,
      lastActivity: new Date().toISOString(),
      daysRemaining: prev.threshold,
    }));
  };

  const handleRefreshData = () => {
    setLastRefresh(new Date());
    toast({
      title: "🔄 Data Refreshed",
      description:
        "Wallet data has been updated with the latest blockchain information.",
    });
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "📋 Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "obsolete":
        return "bg-red-100 text-red-800 border-red-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-rollback-cream text-rollback-dark border-rollback-light";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "obsolete":
        return <Clock className="h-4 w-4" />;
      case "inactive":
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getUrgencyLevel = (daysRemaining: number, threshold: number) => {
    const percentage = (daysRemaining / threshold) * 100;
    if (percentage <= 10)
      return { level: "critical", color: "text-red-600", bg: "bg-red-50" };
    if (percentage <= 25)
      return { level: "high", color: "text-orange-600", bg: "bg-orange-50" };
    if (percentage <= 50)
      return { level: "medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "low", color: "text-blue-600", bg: "bg-blue-50" };
  };

  // Show wallet connection state if not connected
  if (!isConnected || isConnecting) {
    return (
      <WalletConnectionState
        isConnected={isConnected}
        isConnecting={isConnecting}
        address={address}
      />
    );
  }

  const progressPercentage =
    ((selectedWallet.threshold - selectedWallet.daysRemaining) /
      selectedWallet.threshold) *
    100;
  const urgency = getUrgencyLevel(
    selectedWallet.daysRemaining,
    selectedWallet.threshold
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Enhanced Header */}
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
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Select
              value={selectedWallet.id}
              onValueChange={(value) => {
                const wallet = mockWallets.find((w) => w.id === value);
                if (wallet) setSelectedWallet(wallet);
              }}
            >
              <SelectTrigger className="w-full lg:w-80 border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {mockWallets.map((wallet) => (
                  <SelectItem
                    key={wallet.id}
                    value={wallet.id}
                    className="hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-rollback-dark" />
                      <span className="text-sm text-rollback-dark">
                        {wallet.address.slice(0, 10)}...
                        {wallet.address.slice(-8)}
                      </span>
                      <Badge
                        variant="outline"
                        className={getStatusColor(wallet.status)}
                      >
                        {getStatusIcon(wallet.status)}
                        <span className="ml-1">{wallet.status}</span>
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Alerts */}
        {selectedWallet.status === "warning" && (
          <Alert className="mb-6 border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Warning:</strong> This wallet will trigger rollback in{" "}
              {selectedWallet.daysRemaining} days. Consider resetting activity
              or reviewing your configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Wallet Status Card */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center mr-2">
                  <Shield className="h-3 w-3 text-white" />
                </div>
                Wallet Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={getStatusColor(selectedWallet.status)}>
                  {getStatusIcon(selectedWallet.status)}
                  <span className="ml-1 capitalize">
                    {selectedWallet.status}
                  </span>
                </Badge>
              </div>
              <p className="text-xs text-gray-600 flex-1">
                {selectedWallet.status === "active"
                  ? `${selectedWallet.daysRemaining} days until threshold`
                  : selectedWallet.status === "warning"
                  ? `${selectedWallet.daysRemaining} days remaining`
                  : "No longer monitored"}
              </p>
              {selectedWallet.status !== "obsolete" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-all duration-200 rounded-xl"
                  onClick={handleResetActivity}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Reset Activity
                </Button>
              )}
            </CardContent>
          </Card>

          {/* System Stats Card */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center mr-2">
                  <BarChart3 className="h-3 w-3 text-white" />
                </div>
                System Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="text-xl font-bold text-gray-900">
                {mockWallets.filter((w) => w.status === "active").length}/
                {mockWallets.length}
              </div>
              <p className="text-xs text-gray-600 mt-1 flex-1">
                Active wallets
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-all duration-200 rounded-xl"
                onClick={() => setIsStatsModalOpen(true)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>

          {/* Total Value Card */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center mr-2">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="text-xl font-bold text-gray-900">
                ${selectedWallet.totalValueUSD.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1 flex-1">
                {selectedWallet.totalValue}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-all duration-200 rounded-xl"
                onClick={() => setIsValueModalOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Breakdown
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timer Card */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center mr-2">
                  <Timer className="h-3 w-3 text-white" />
                </div>
                Activity Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className={`text-xl font-bold mb-2 ${urgency.color}`}>
                {selectedWallet.daysRemaining} days
              </div>
              <Progress
                value={progressPercentage}
                className="h-3 mb-2 rounded-full"
              />
              <div
                className={`text-xs px-2 py-1 rounded-full ${urgency.bg} ${urgency.color} mb-1`}
              >
                {urgency.level.toUpperCase()} URGENCY
              </div>
              <p className="text-xs text-gray-600 mt-1 flex-1">
                Threshold: {selectedWallet.threshold} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Configuration */}
          <Card className="lg:col-span-2 border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <span>Wallet Configuration</span>
              </CardTitle>
              <CardDescription>
                Current settings for {selectedWallet.address.slice(0, 10)}...
                {selectedWallet.address.slice(-8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Basic Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Wallet Address:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-900">
                            {selectedWallet.address.slice(0, 6)}...
                            {selectedWallet.address.slice(-4)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyAddress(selectedWallet.address)
                            }
                            className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors duration-200 rounded-lg"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Threshold:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedWallet.threshold} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Method:</span>
                        <Badge
                          variant="outline"
                          className="border-[#E9A344] text-[#E9A344] rounded-full"
                        >
                          {selectedWallet.rollbackMethod}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Monitored Tokens
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedWallet.monitoredTokens.map((token) => (
                        <Badge
                          key={token}
                          variant="secondary"
                          className="text-xs rounded-full"
                        >
                          {token}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Owner Wallets
                    </h3>
                    <div className="space-y-2">
                      {selectedWallet.ownerWallets.map((owner, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">
                              #{owner.priority}
                            </span>
                            <span className="text-xs font-mono text-gray-900">
                              {owner.address.slice(0, 6)}...
                              {owner.address.slice(-4)}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs rounded-full ${getStatusColor(
                              owner.status
                            )}`}
                          >
                            {owner.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Last Activity
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(selectedWallet.lastActivity).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200 rounded-xl"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/governance")}
                    className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-all duration-200 rounded-xl"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://etherscan.io/address/${selectedWallet.address}`,
                        "_blank"
                      )
                    }
                    className="border-[#E9A344] text-[#E9A344] hover:bg-[#E9A344] hover:text-white transition-all duration-200 rounded-xl"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-gray-200 bg-white hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span>Recent Activity</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="hover:bg-gray-100 transition-colors duration-200 rounded-xl"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivity.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === "completed"
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type}
                        </p>
                        <span className="text-xs text-gray-600">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {activity.details}
                      </p>
                      {activity.txHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 p-0 text-xs text-[#E9A344] hover:text-[#E9A344]/80 hover:bg-transparent transition-colors duration-200"
                          onClick={() =>
                            window.open(
                              `https://etherscan.io/tx/${activity.txHash}`,
                              "_blank"
                            )
                          }
                        >
                          View Transaction
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Analytics */}
        <Card className="border-gray-200 bg-white mb-8 hover:shadow-xl hover:shadow-[#E9A344]/10 transition-all duration-300 rounded-3xl border-2 hover:border-[#E9A344]/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E9A344] to-[#D4941A] rounded-xl flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span>Portfolio Analytics</span>
            </CardTitle>
            <CardDescription>
              Portfolio value and activity trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value, name) => [
                      name === "value" ? `$${value.toLocaleString()}` : value,
                      name === "value" ? "Portfolio Value" : "Token Count",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#E9A344"
                    fill="#E9A344"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <InfoModal
          isOpen={isValueModalOpen}
          onClose={() => setIsValueModalOpen(false)}
          title="Portfolio Breakdown"
          description="Detailed view of your token holdings and distribution"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Token Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tokenDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {tokenDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Value",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Token Details</h3>
              <div className="space-y-3">
                {mockTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {token.symbol}
                      </p>
                      <p className="text-sm text-gray-600">{token.balance}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{token.value}</p>
                      <p
                        className={`text-sm ${
                          token.change24h >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {token.change24h >= 0 ? "+" : ""}
                        {token.change24h}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          title="Complete Activity History"
          description="All activities across your rollback wallets"
        >
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivity.map((activity, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TableCell className="text-sm">
                      {new Date(activity.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {activity.details}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          title="System Statistics"
          description="Overview of your rollback wallet system performance"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-600">Total Wallets</p>
                <p className="text-xl font-bold text-gray-900">
                  {mockWallets.length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">
                  $
                  {mockWallets
                    .reduce((sum, w) => sum + w.totalValueUSD, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-600">Active Wallets</p>
                <p className="text-xl font-bold text-gray-900">
                  {mockWallets.filter((w) => w.status === "active").length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-600">Total Warnings</p>
                <p className="text-xl font-bold text-gray-900">
                  {mockWallets.reduce((sum, w) => sum + w.warningsSent, 0)}
                </p>
              </div>
            </div>
          </div>
        </InfoModal>

        <InfoModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          title="Emergency Rollback"
          description="Immediate emergency recovery with 1.5 day timelock"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This action will trigger an immediate emergency recovery with a
              1.5 day timelock.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200 rounded-xl"
              onClick={() => {
                // Implement emergency recovery logic here
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Confirm Emergency Recovery
            </Button>
          </div>
        </InfoModal>
      </div>
    </div>
  );
}
