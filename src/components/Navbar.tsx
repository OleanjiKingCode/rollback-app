'use client';

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Plus,
  Settings,
  User,
  Bell,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Wallet', href: '/create', icon: Plus },
  { name: 'Governance', href: '/governance', icon: Settings },
  { name: 'Agent Management', href: '/agent', icon: User },
  { name: 'Subscription', href: '/subscribe', icon: Bell },
];

export function Navbar() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleWalletAction = async () => {
    if (isConnected) {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } else {
      await open();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-rollback-cream bg-rollback-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="text-2xl font-bold text-rollback-dark">
                Rollback
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === item.href
                      ? 'text-rollback-primary'
                      : 'text-rollback-brown hover:text-rollback-primary'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
            <Button
              onClick={handleWalletAction}
              data-wallet-button
              data-connected={isConnected}
              className={`ml-4 ${
                isConnected
                  ? 'border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white'
                  : 'bg-rollback-primary text-white hover:bg-rollback-primary/90'
              }`}
            >
              {isConnected ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {formatAddress(address || '')}
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2"
              aria-label="Main menu"
              aria-expanded="false"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2 px-3 text-base font-medium ${
                    pathname === item.href
                      ? 'text-rollback-primary'
                      : 'text-rollback-brown hover:text-rollback-primary'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <div className="px-3 py-2">
              <Button
                onClick={handleWalletAction}
                className={`w-full justify-center ${
                  isConnected
                    ? 'border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white'
                    : 'bg-rollback-primary text-white hover:bg-rollback-primary/90'
                }`}
              >
                {isConnected ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {formatAddress(address || '')}
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
