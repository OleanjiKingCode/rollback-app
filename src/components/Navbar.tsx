
'use client';

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Home, 
  Plus, 
  Settings, 
  User,
  LayoutDashboard,
  Bell
} from 'lucide-react';

// Mock wallet connection - replace with wagmi hooks
const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const connect = () => {
    // Mock connection - replace with useConnect from wagmi
    setIsConnected(true);
    setAddress('0x1234...5678');
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };

  return { isConnected, address, connect, disconnect };
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Wallet', href: '/create', icon: Plus },
  { name: 'Governance', href: '/governance', icon: Settings },
  { name: 'Agent Management', href: '/agent', icon: User },
  { name: 'Subscription', href: '/subscribe', icon: Bell },
];

export function Navbar() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } else {
      connect();
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-[9999] w-full border-b border-rollback-cream !bg-rollback-light backdrop-blur supports-[backdrop-filter]:!bg-rollback-light">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/lovable-uploads/86a7596b-4477-45a7-88bb-9de6bbadd014.png"
                alt="Rollback Wallet"
                width={40}
                height={40}
                className="h-10 w-10"
              />
            </div>
            <span className="text-xl font-bold text-rollback-dark">
              Rollback
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rollback-primary text-white'
                      : 'text-rollback-brown hover:text-rollback-dark hover:bg-rollback-cream'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleWalletAction}
              variant={isConnected ? "outline" : "default"}
              className={
                isConnected
                  ? "border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white !bg-transparent"
                  : "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
              }
              size="sm"
              data-wallet-button="true"
              data-connected={isConnected}
            >
              <Wallet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {isConnected ? formatAddress(address!) : 'Connect Wallet'}
              </span>
              <span className="sm:hidden">
                {isConnected ? 'Connected' : 'Connect'}
              </span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-rollback-cream !bg-transparent"
                  data-mobile-menu="true"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 !bg-rollback-light border-rollback-cream z-[9999]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-rollback-primary text-white'
                            : 'text-rollback-brown hover:text-rollback-dark hover:bg-rollback-cream'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
