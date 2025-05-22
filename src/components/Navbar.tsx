
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { 
  wallet, 
  home, 
  plus, 
  settings, 
  user,
  layout-dashboard,
  bell
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
  { name: 'Dashboard', href: '/dashboard', icon: layout-dashboard },
  { name: 'Create Wallet', href: '/create', icon: plus },
  { name: 'Governance', href: '/governance', icon: settings },
  { name: 'Agent Management', href: '/agent', icon: user },
  { name: 'Subscription', href: '/subscribe', icon: bell },
];

export function Navbar() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const pathname = usePathname();
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
    <nav className="sticky top-0 z-50 w-full border-b border-rollback-cream bg-rollback-light/95 backdrop-blur supports-[backdrop-filter]:bg-rollback-light/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <Image
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
                  href={item.href}
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
                  ? "border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white"
                  : "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
              }
            >
              <wallet className="h-4 w-4 mr-2" />
              {isConnected ? formatAddress(address!) : 'Connect Wallet'}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <div className="flex flex-col space-y-1">
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-rollback-light">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
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
