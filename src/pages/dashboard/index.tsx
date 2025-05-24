
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Clock, 
  Settings, 
  Copy,
  ChevronDown,
  Bell,
  User,
  Eye,
  ExternalLink
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

// Mock data - replace with actual contract calls
const mockWallets = [
  {
    id: '1',
    address: '0x1234567890123456789012345678901234567890',
    status: 'active',
    threshold: 30,
    daysRemaining: 3, // Less than 5 to show red indicator
    totalValue: '125.5 ETH',
    agentWallet: '0xabcd...efgh'
  },
  {
    id: '2', 
    address: '0x0987654321098765432109876543210987654321',
    status: 'obsolete',
    threshold: 60,
    daysRemaining: 45,
    totalValue: '89.2 ETH',
    agentWallet: '0x1234...5678'
  }
];

const mockTokens = [
  { symbol: 'ETH', balance: '125.5', value: '$251,000', address: 'native', valueNum: 251000 },
  { symbol: 'USDC', balance: '50,000', value: '$50,000', address: '0xa0b86a33e6ba', valueNum: 50000 },
  { symbol: 'DAI', balance: '25,000', value: '$25,000', address: '0x6B175474E89', valueNum: 25000 }
];

const mockOwnerWallets = [
  { address: '0x1111111111111111111111111111111111111111', priority: 1 },
  { address: '0x2222222222222222222222222222222222222222', priority: 2 },
  { address: '0x3333333333333333333333333333333333333333', priority: 3 }
];

const mockFallbackWallet = {
  address: '0x4444444444444444444444444444444444444444',
  status: 'active'
};

const mockActivity = [
  { date: '2024-01-20', type: 'Activity Reset', details: 'Manual reset by user', status: 'completed' },
  { date: '2024-01-15', type: 'Config Update', details: 'Updated inactivity threshold', status: 'completed' },
  { date: '2024-01-10', type: 'Token Added', details: 'Added USDC to monitoring', status: 'completed' }
];

const mockAnalytics = [
  { date: '2024-01-01', value: 100000 },
  { date: '2024-01-08', value: 150000 },
  { date: '2024-01-15', value: 200000 },
  { date: '2024-01-22', value: 326000 }
];

const mockTokenDistribution = [
  { name: 'ETH', value: 251000, fill: '#E9A344' },
  { name: 'USDC', value: 50000, fill: '#F5C678' },
  { name: 'DAI', value: 25000, fill: '#8B5E3C' }
];

const mockWalletDistribution = [
  { name: 'Wallet 1', value: 200000, fill: '#E9A344' },
  { name: 'Wallet 2', value: 126000, fill: '#F5C678' }
];

export default function Dashboard() {
  const [selectedWallet, setSelectedWallet] = useState(mockWallets[0]);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetActivity = () => {
    // Mock transaction - replace with actual contract call
    toast({
      title: "Activity Reset",
      description: "Your activity timer has been reset successfully.",
    });
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-rollback-primary/10 text-rollback-primary border-rollback-primary';
      case 'obsolete': return 'bg-rollback-brown/10 text-rollback-brown border-rollback-brown';
      case 'fallback-mode': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-rollback-cream text-rollback-dark border-rollback-light';
    }
  };

  const progressPercentage = ((selectedWallet.threshold - selectedWallet.daysRemaining) / selectedWallet.threshold) * 100;
  const isLowDaysRemaining = selectedWallet.daysRemaining < 5;

  const totalValue = mockTokens.reduce((sum, token) => sum + token.valueNum, 0);

  return (
    <div className="min-h-screen bg-rollback-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-rollback-dark mb-2">Dashboard</h1>
            <p className="text-rollback-brown">Monitor and manage your Rollback Wallets</p>
          </div>
          
          {/* Wallet Selector */}
          <div className="mt-4 lg:mt-0">
            <Select value={selectedWallet.id} onValueChange={(value) => {
              const wallet = mockWallets.find(w => w.id === value);
              if (wallet) setSelectedWallet(wallet);
            }}>
              <SelectTrigger className="w-80 border-rollback-cream">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockWallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4" />
                      <span>{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</span>
                      <Badge variant="outline" className={getStatusColor(wallet.status)}>
                        {wallet.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Wallet Value Card */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-dark">Total Wallet Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rollback-dark">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-rollback-brown mt-1">Across all monitored tokens</p>
              <Dialog open={isValueModalOpen} onOpenChange={setIsValueModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2 border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white">
                    <Eye className="h-4 w-4 mr-2" />
                    View Distribution
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Value Distribution</DialogTitle>
                    <DialogDescription className="text-rollback-dark">
                      Distribution of your wallet value by tokens and wallets
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">By Tokens</h3>
                      <ChartContainer
                        config={{
                          value: { label: "Value", color: "#E9A344" }
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={mockTokenDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {mockTokenDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">By Wallets</h3>
                      <ChartContainer
                        config={{
                          value: { label: "Value", color: "#E9A344" }
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={mockWalletDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {mockWalletDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-dark">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={getStatusColor(selectedWallet.status)}>
                {selectedWallet.status === 'active' ? 'Active' : 
                 selectedWallet.status === 'obsolete' ? 'Obsolete' : 'Fallback Mode'}
              </Badge>
              <p className="text-xs text-rollback-brown mt-1">Wallet monitoring status</p>
            </CardContent>
          </Card>

          {/* Days Remaining Card */}
          <Card className={`bg-white ${isLowDaysRemaining ? 'border-red-500 border-2 bg-red-50' : 'border-rollback-cream'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isLowDaysRemaining ? 'text-red-700' : 'text-rollback-dark'}`}>
                Days Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isLowDaysRemaining ? 'text-red-700' : 'text-rollback-dark'}`}>
                {selectedWallet.daysRemaining}
              </div>
              <Progress value={progressPercentage} className="mt-2" />
              <p className={`text-xs mt-1 ${isLowDaysRemaining ? 'text-red-600' : 'text-rollback-brown'}`}>
                Until inactivity threshold
                {isLowDaysRemaining && ' - URGENT!'}
              </p>
            </CardContent>
          </Card>

          {/* Agent Wallet Card */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-dark">Agent Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono text-rollback-dark">{selectedWallet.agentWallet}</div>
              <p className="text-xs text-rollback-brown mt-1">Agent Management</p>
              <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2 border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agent Wallet Details</DialogTitle>
                    <DialogDescription className="text-rollback-dark">
                      Details and management options for your agent wallet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                      <span className="text-sm font-medium">Address:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{selectedWallet.agentWallet}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAddress(selectedWallet.agentWallet)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant="outline" className="bg-rollback-primary/10 text-rollback-primary border-rollback-primary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                      <span className="text-sm font-medium">Last Activity:</span>
                      <span className="text-sm">2 hours ago</span>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        onClick={() => {
                          setIsAgentModalOpen(false);
                          navigate('/agent');
                        }}
                        className="bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Agent
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Overview */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-rollback-primary" />
                <span>Wallet Overview</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                Current wallet configuration and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                <span className="text-sm font-medium">Address:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{selectedWallet.address.slice(0, 10)}...{selectedWallet.address.slice(-8)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyAddress(selectedWallet.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                <span className="text-sm font-medium">Inactivity Threshold:</span>
                <span className="text-sm">{selectedWallet.threshold} days</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                <span className="text-sm font-medium">Rollback Mechanism:</span>
                <span className="text-sm">Priority-based</span>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleResetActivity} className="bg-rollback-primary hover:bg-rollback-primary/90 text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  Reset Activity
                </Button>
                <Button variant="outline" className="border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Modify Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader>
              <CardTitle>Value Analytics</CardTitle>
              <CardDescription className="text-rollback-dark">Total value locked over time</CardDescription>
            </CardHeader>
            <CardContent className='text-rollback-dark'>
              <DashboardCharts mockAnalytics={mockAnalytics} />
            </CardContent>
          </Card>

          {/* Monitored Tokens */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader>
              <CardTitle>Monitored Tokens</CardTitle>
              <CardDescription className="text-rollback-dark">Current balances of monitored assets</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-rollback-dark">Token</TableHead>
                    <TableHead className="text-rollback-dark">Balance</TableHead>
                    <TableHead className="text-rollback-dark">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{token.symbol}</TableCell>
                      <TableCell>{token.balance}</TableCell>
                      <TableCell>{token.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Owner Wallets & Fallback Wallet */}
          <Card className="border-rollback-cream bg-white">
            <CardHeader>
              <CardTitle>Owner Wallets & Fallback</CardTitle>
              <CardDescription className="text-rollback-dark">Configured recovery addresses and fallback wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-rollback-brown mb-2">Owner Wallets</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-rollback-dark">Priority</TableHead>
                      <TableHead className="text-rollback-dark">Address</TableHead>
                      <TableHead className="text-rollback-dark">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOwnerWallets.map((wallet, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">#{wallet.priority}</TableCell>
                        <TableCell className="font-mono">
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAddress(wallet.address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-rollback-brown mb-2">Fallback Wallet</h4>
                <div className="flex items-center justify-between p-3 bg-rollback-cream rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{mockFallbackWallet.address.slice(0, 10)}...{mockFallbackWallet.address.slice(-8)}</span>
                    <Badge variant="outline" className="bg-rollback-primary/10 text-rollback-primary border-rollback-primary">{mockFallbackWallet.status}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyAddress(mockFallbackWallet.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="border-rollback-cream bg-white mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-rollback-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription className="text-rollback-dark">Latest events and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-rollback-dark">Date</TableHead>
                  <TableHead className="text-rollback-dark">Type</TableHead>
                  <TableHead className="text-rollback-dark">Details</TableHead>
                  <TableHead className="text-rollback-dark">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.date}</TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.details}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-rollback-primary/10 text-rollback-primary border-rollback-primary">
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
