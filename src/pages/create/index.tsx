'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Minus, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Wallet,
  Clock,
  Shield
} from 'lucide-react';

type WalletConfig = {
  fallbackWallets: string[];
  threshold: number;
  thresholdUnit: 'days' | 'weeks' | 'months';
  monitoredTokens: string[];
  rollbackMechanism: 'priority' | 'randomized';
  agentWallet: string;
};

const availableTokens = [
  { symbol: 'ETH', address: 'native', name: 'Ethereum' },
  { symbol: 'USDC', address: '0xa0b86a33e6ba', name: 'USD Coin' },
  { symbol: 'DAI', address: '0x6B175474E89', name: 'Dai Stablecoin' },
  { symbol: 'USDT', address: '0xdAC17F958D2ee', name: 'Tether USD' },
  { symbol: 'WBTC', address: '0x2260FAC5E552', name: 'Wrapped Bitcoin' }
];

export default function CreateRollbackWallet() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<WalletConfig>({
    fallbackWallets: [''],
    threshold: 30,
    thresholdUnit: 'days',
    monitoredTokens: [],
    rollbackMechanism: 'priority',
    agentWallet: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const addFallbackWallet = () => {
    if (config.fallbackWallets.length < 10) {
      setConfig(prev => ({
        ...prev,
        fallbackWallets: [...prev.fallbackWallets, '']
      }));
    }
  };

  const removeFallbackWallet = (index: number) => {
    setConfig(prev => ({
      ...prev,
      fallbackWallets: prev.fallbackWallets.filter((_, i) => i !== index)
    }));
  };

  const updateFallbackWallet = (index: number, address: string) => {
    setConfig(prev => ({
      ...prev,
      fallbackWallets: prev.fallbackWallets.map((addr, i) => i === index ? address : addr)
    }));
  };

  const toggleToken = (tokenAddress: string) => {
    setConfig(prev => ({
      ...prev,
      monitoredTokens: prev.monitoredTokens.includes(tokenAddress)
        ? prev.monitoredTokens.filter(addr => addr !== tokenAddress)
        : [...prev.monitoredTokens, tokenAddress]
    }));
  };

  const handleCreateWallet = async () => {
    setIsCreating(true);
    
    // Mock wallet creation - replace with actual contract call
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate transaction
      
      toast({
        title: "Rollback Wallet Created!",
        description: "Your new rollback wallet has been created successfully.",
      });
      
      // Reset form or redirect to dashboard
      setCurrentStep(1);
      setConfig({
        fallbackWallets: [''],
        threshold: 30,
        thresholdUnit: 'days',
        monitoredTokens: [],
        rollbackMechanism: 'priority',
        agentWallet: ''
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create rollback wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.fallbackWallets.some(addr => addr.length > 0);
      case 2:
        return config.threshold > 0;
      case 3:
        return config.monitoredTokens.length > 0;
      case 4:
        return true; // Rollback mechanism has default
      case 5:
        return config.agentWallet.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-rollback-primary" />
                <span>Fallback Wallets</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                Add up to 10 fallback wallet addresses for recovery (max 10)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.fallbackWallets.map((address, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Label className="w-16 text-sm">#{index + 1}</Label>
                  <Input
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => updateFallbackWallet(index, e.target.value)}
                    className="flex-1"
                  />
                  {config.fallbackWallets.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFallbackWallet(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {config.fallbackWallets.length < 10 && (
                <Button
                  variant="outline"
                  onClick={addFallbackWallet}
                  className="w-full border-rollback-primary text-rollback-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fallback Wallet
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-rollback-primary" />
                <span>Inactivity Threshold</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                Set the period of inactivity before rollback is initiated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label htmlFor="threshold">Duration</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    value={config.threshold}
                    onChange={(e) => setConfig(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={config.thresholdUnit}
                    onValueChange={(value: 'days' | 'weeks' | 'months') => 
                      setConfig(prev => ({ ...prev, thresholdUnit: value }))
                    }
                  >
                    <SelectTrigger className="bg-white border-rollback-cream text-rollback-brown">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 bg-rollback-cream rounded-lg">
                <p className="text-sm text-rollback-brown">
                  Rollback will be initiated after <strong>{config.threshold} {config.thresholdUnit}</strong> of inactivity.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle>Monitored Tokens</CardTitle>
              <CardDescription className="text-rollback-dark">
                Select up to 5 tokens to monitor (including ETH)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableTokens.map((token) => (
                  <div key={token.address} className="flex items-center space-x-3 p-3 border border-rollback-cream rounded-lg">
                    <Checkbox
                      id={token.address}
                      checked={config.monitoredTokens.includes(token.address)}
                      onCheckedChange={() => toggleToken(token.address)}
                      disabled={!config.monitoredTokens.includes(token.address) && config.monitoredTokens.length >= 5}
                    />
                    <div className="flex-1">
                      <Label htmlFor={token.address} className="font-medium">{token.symbol}</Label>
                      <p className="text-sm text-rollback-brown">{token.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-rollback-cream rounded-lg">
                <p className="text-sm text-rollback-brown">
                  Selected: {config.monitoredTokens.length}/5 tokens
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-rollback-primary" />
                <span>Rollback Mechanism</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                Choose how fallback wallets are selected during rollback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={config.rollbackMechanism}
                onValueChange={(value: 'priority' | 'randomized') => 
                  setConfig(prev => ({ ...prev, rollbackMechanism: value }))
                }
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 p-4 border border-rollback-cream rounded-lg">
                  <RadioGroupItem value="priority" id="priority" />
                  <div className="flex-1">
                    <Label htmlFor="priority" className="font-medium">Priority-based</Label>
                    <p className="text-sm text-rollback-brown">
                      Fallback wallets are selected in order of priority (1, 2, 3...)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border border-rollback-cream rounded-lg">
                  <RadioGroupItem value="randomized" id="randomized" />
                  <div className="flex-1">
                    <Label htmlFor="randomized" className="font-medium">Randomized</Label>
                    <p className="text-sm text-rollback-brown">
                      Fallback wallet is selected randomly using block hash or Chainlink VRF
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="border-rollback-cream">
            <CardHeader>
              <CardTitle>Agent Wallet</CardTitle>
              <CardDescription className="text-rollback-dark">
                Assign an Agent Wallet for enhanced security and automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="agentWallet">Agent Wallet Address</Label>
                <Input
                  id="agentWallet"
                  placeholder="0x..."
                  value={config.agentWallet}
                  onChange={(e) => setConfig(prev => ({ ...prev, agentWallet: e.target.value }))}
                />
              </div>
              
              <div className="p-4 bg-rollback-cream rounded-lg">
                <h4 className="font-medium text-rollback-dark mb-2">What is an Agent Wallet?</h4>
                <p className="text-sm text-rollback-brown">
                  Agent Wallets provide additional security layers and can automate certain recovery processes. 
                  This is part of our enhanced architecture with improved block hash randomization.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (currentStep === totalSteps + 1) {
    return (
      <div className="min-h-screen bg-rollback-light">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-rollback-cream">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-rollback-primary" />
                <span>Review Configuration</span>
              </CardTitle>
              <CardDescription className="text-rollback-dark">
                Please review your rollback wallet configuration before creating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-rollback-cream rounded-lg">
                  <h4 className="font-medium mb-2">Fallback Wallets ({config.fallbackWallets.filter(addr => addr).length})</h4>
                  {config.fallbackWallets.filter(addr => addr).map((addr, index) => (
                    <p key={index} className="text-sm text-rollback-brown font-mono">
                      #{index + 1}: {addr}
                    </p>
                  ))}
                </div>
                
                <div className="p-4 bg-rollback-cream rounded-lg">
                  <h4 className="font-medium mb-2">Inactivity Threshold</h4>
                  <p className="text-sm text-rollback-brown">
                    {config.threshold} {config.thresholdUnit}
                  </p>
                </div>
                
                <div className="p-4 bg-rollback-cream rounded-lg">
                  <h4 className="font-medium mb-2">Monitored Tokens ({config.monitoredTokens.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.monitoredTokens.map(tokenAddr => {
                      const token = availableTokens.find(t => t.address === tokenAddr);
                      return (
                        <span key={tokenAddr} className="px-2 py-1 bg-rollback-primary text-white text-xs rounded">
                          {token?.symbol}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 bg-rollback-cream rounded-lg">
                  <h4 className="font-medium mb-2">Rollback Mechanism</h4>
                  <p className="text-sm text-rollback-brown capitalize">
                    {config.rollbackMechanism}
                  </p>
                </div>
                
                <div className="p-4 bg-rollback-cream rounded-lg">
                  <h4 className="font-medium mb-2">Agent Wallet</h4>
                  <p className="text-sm text-rollback-brown font-mono">
                    {config.agentWallet}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  variant="back"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateWallet}
                  disabled={isCreating}
                  className="flex-1 bg-rollback-primary hover:bg-rollback-primary/90"
                >
                  {isCreating ? 'Creating...' : 'Create Rollback Wallet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rollback-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rollback-dark mb-2">Create Rollback Wallet</h1>
          <p className="text-rollback-brown">Set up your automatic crypto recovery system</p>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-rollback-brown">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-rollback-brown">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="max-w-2xl mx-auto">
          <div className="flex space-x-4">
            {currentStep > 1 && (
              <Button
                variant="back"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-transparent border-rollback-primary text-rollback-primary hover:bg-rollback-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button
              onClick={() => {
                if (currentStep === totalSteps) {
                  setCurrentStep(currentStep + 1);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={!canProceed()}
              className="flex-1 bg-rollback-primary hover:bg-rollback-primary/90"
            >
              {currentStep === totalSteps ? 'Review' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
