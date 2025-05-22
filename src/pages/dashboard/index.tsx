'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Clock, 
  Settings, 
  Copy,
  ChevronDown,
  Bell,
  User
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data - replace with actual contract calls
const mockWallets = [
  {
    id: '1',
    address: '0x1234567890123456789012345678901234567890',
    status: 'active',
    threshold: 30,
    daysRemaining: 25,
    totalValue: '125.5 ETH',
    agentWallet: '0xabcd...efgh'
  },
  {
    id: '2', 
    address: '0x0987654321098765432109876543210987654321',
    status: 'monitoring',
    threshold: 60,
    daysRemaining: 45,
    totalValue: '89.2 ETH',
    agentWallet: '0x1234...5678'
  }
];

const mockTokens = [
  { symbol: 'ETH', balance: '125.5', value: '$251,000', address: 'native' },
  { symbol: 'USDC', balance: '50,000', value: '$50,000', address: '0xa0b86a33e6ba' },
  { symbol: 'DAI', balance: '25,000', value: '$25,000', address: '0x6B175474E89' }
];

const mockFallbackWallets = [
  { address: '0x1111111111111111111111111111111111111111', priority: 1 },
  { address: '0x2222222222222222222222222222222222222222', priority: 2 },
  { address: '0x3333333333333333333333333333333333333333', priority: 3 }
];

const mockActivity = [
  { date: '2024-01-20', type: 'Activity Reset', details: 'Manual reset by user' },
  { date: '2024-01-15', type: 'Config Update', details: 'Updated inactivity threshold' },
  { date: '2024-01-10', type: 'Token Added', details: 'Added USDC to monitoring' }
];

const mockAnalytics = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-08', value: 105 },
  { date: '2024-01-15', value: 110 },
  { date: '2024-01-22', value: 125 }
];

export default function Dashboard() {
  const [selectedWallet, setSelectedWallet] = useState(mockWallets[0]);
  const { toast } = useToast();

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
      case 'active': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'rollback-pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = ((selectedWallet.threshold - selectedWallet.daysRemaining) / selectedWallet.threshold) * 100;

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
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockWallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4" />
                      <span>{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</span>
                      <Badge variant="secondary" className={getStatusColor(wallet.status)}>
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
          <Card className="border-rollback-cream">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-brown">Total Value Locked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rollback-dark">{selectedWallet.totalValue}</div>
              <p className="text-xs text-rollback-brown mt-1">Across all monitored tokens</p>
            </CardContent>
          </Card>

          <Card className="border-rollback-cream">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-brown">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(selectedWallet.status)}>
                {selectedWallet.status.charAt(0).toUpperCase() + selectedWallet.status.slice(1)}
              </Badge>
              <p className="text-xs text-rollback-brown mt-1">Wallet monitoring status</p>
            </CardContent>
          </Card>

          <Card className="border-rollback-cream">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-brown">Days Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rollback-dark">{selectedWallet.daysRemaining}</div>
              <Progress value={progressPercentage} className="mt-2" />
              <p className="text-xs text-rollback-brown mt-1">Until inactivity threshold</p>
            </CardContent>
          </Card>

          <Card className="border-rollback-cream">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rollback-brown">Agent Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono text-rollback-dark">{selectedWallet.agentWallet}</div>
              <p className="text-xs text-rollback-brown mt-1">V2 Agent Management</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Overview */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-rollback-primary" />
                <span>Wallet Overview</span>
              </CardTitle>
              <CardDescription>
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
                <Button onClick={handleResetActivity} className="bg-rollback-primary hover:bg-rollback-primary/90">
                  <Clock className="h-4 w-4 mr-2" />
                  Reset Activity
                </Button>
                <Button variant="outline" className="border-rollback-primary text-rollback-primary">
                  <Settings className="h-4 w-4 mr-2" />
                  Modify Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle>Value Analytics</CardTitle>
              <CardDescription>Total value locked over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockAnalytics}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#E9A344" 
                    strokeWidth={2}
                    dot={{ fill: '#E9A344' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monitored Tokens */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle>Monitored Tokens</CardTitle>
              <CardDescription>Current balances of monitored assets</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Value</TableHead>
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

          {/* Fallback Wallets */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle>Fallback Wallets</CardTitle>
              <CardDescription>Configured recovery addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFallbackWallets.map((wallet, index) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="border-rollback-cream mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-rollback-primary" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest events and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-rollback-cream rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-rollback-dark">{activity.type}</span>
                      <span className="text-sm text-rollback-brown">{activity.date}</span>
                    </div>
                    <p className="text-sm text-rollback-brown mt-1">{activity.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
