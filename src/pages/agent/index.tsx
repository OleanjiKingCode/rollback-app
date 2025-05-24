'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Check, Plus, Settings, Copy } from 'lucide-react';

const mockWallets = [{
  id: '1',
  address: '0x1234567890123456789012345678901234567890',
  agentWallet: '0xabcd1234567890123456789012345678901234efgh',
  status: 'active'
}, {
  id: '2',
  address: '0x0987654321098765432109876543210987654321',
  agentWallet: null,
  status: 'no-agent'
}];
const mockAgentCapabilities = ['Automated activity monitoring', 'Enhanced security validations', 'Block hash randomization (V2)', 'Emergency recovery assistance', 'Gas optimization for transactions', 'Multi-signature coordination'];
export default function AgentManagement() {
  const [selectedWallet, setSelectedWallet] = useState(mockWallets[0]);
  const [newAgentAddress, setNewAgentAddress] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    toast
  } = useToast();
  const handleAssignAgent = async () => {
    if (!newAgentAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid agent wallet address.",
        variant: "destructive"
      });
      return;
    }
    setIsAssigning(true);
    try {
      // Mock agent assignment - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Agent Assigned",
        description: "Agent wallet has been successfully assigned to your rollback wallet."
      });
      setNewAgentAddress('');
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign agent wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };
  const handleGenerateAgent = async () => {
    setIsGenerating(true);
    try {
      // Mock agent generation - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 3000));
      const generatedAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setNewAgentAddress(generatedAddress);
      toast({
        title: "Agent Generated",
        description: "A new agent wallet has been generated and whitelisted."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate agent wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Agent wallet address copied to clipboard."
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-rollback-primary/10 text-rollback-primary border-rollback-primary';
      case 'no-agent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="min-h-screen bg-rollback-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-rollback-dark mb-2">Agent Wallet Management</h1>
          <p className="text-rollback-brown">
            Manage Agent Wallets for enhanced V2 architecture security and automation
          </p>
        </div>

        {/* Wallet Selector */}
        <Card className="border-rollback-cream mb-8">
          <CardHeader>
            <CardTitle>Select Rollback Wallet</CardTitle>
            <CardDescription className="text-rollback-dark">
              Choose which rollback wallet to manage the agent for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedWallet.id} onValueChange={value => {
            const wallet = mockWallets.find(w => w.id === value);
            if (wallet) setSelectedWallet(wallet);
          }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockWallets.map(wallet => <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </span>
                      <Badge className={getStatusColor(wallet.status)}>
                        {wallet.agentWallet ? 'Agent Active' : 'No Agent'}
                      </Badge>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Agent Status */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-rollback-primary" />
                <span>Current Agent Status</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                View and manage the current agent wallet assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWallet.agentWallet ? <div className="space-y-4">
                  <div className="p-4 bg-rollback-primary/10 border border-rollback-primary rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="h-4 w-4 text-rollback-primary" />
                      <span className="font-medium text-rollback-primary">Agent Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-rollback-dark">
                        {selectedWallet.agentWallet}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyAddress(selectedWallet.agentWallet!)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-rollback-brown">
                    <p>Agent wallet is active and providing:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {mockAgentCapabilities.slice(0, 3).map((capability, index) => <li key={index}>{capability}</li>)}
                    </ul>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">No Agent Assigned</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This rollback wallet doesn't have an agent wallet assigned. 
                      Consider assigning one for enhanced V2 features.
                    </p>
                  </div>
                  
                  <div className="text-sm text-rollback-brown">
                    <p>Benefits of assigning an agent wallet:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {mockAgentCapabilities.slice(0, 3).map((capability, index) => <li key={index}>{capability}</li>)}
                    </ul>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Assign/Update Agent */}
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-rollback-primary" />
                <span>{selectedWallet.agentWallet ? 'Update' : 'Assign'} Agent Wallet</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                {selectedWallet.agentWallet ? 'Update the current agent wallet assignment' : 'Assign a new agent wallet for V2 features'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agentAddress">Agent Wallet Address</Label>
                <Input id="agentAddress" placeholder="0x..." value={newAgentAddress} onChange={e => setNewAgentAddress(e.target.value)} />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleGenerateAgent} disabled={isGenerating} variant="outline" className="flex-1 border-rollback-primary text-rollback-primary">
                  {isGenerating ? 'Generating...' : 'Generate Agent'}
                </Button>
                <Button onClick={handleAssignAgent} disabled={isAssigning || !newAgentAddress} className="flex-1 bg-rollback-primary hover:bg-rollback-primary/90">
                  {isAssigning ? 'Assigning...' : 'Assign Agent'}
                </Button>
              </div>

              <div className="p-3 bg-rollback-cream rounded-lg">
                <h4 className="font-medium text-sm mb-2">Agent Wallet Requirements:</h4>
                <ul className="text-xs text-rollback-brown space-y-1">
                  <li>• Must be a valid Ethereum address</li>
                  <li>• Will be whitelisted for V2 operations</li>
                  <li>• Can be changed through governance</li>
                  <li>• Enables block hash randomization</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

      
       
      </div>
    </div>;
}
