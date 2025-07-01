"use client";

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  Home,
  Plus,
  Settings,
  User,
  LayoutDashboard,
  Bell,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Wallet", href: "/create", icon: Plus },
  { name: "Voting", href: "/governance", icon: Settings },
  { name: "Agent Management", href: "/agent", icon: User },
  // { name: "Subscription", href: "/subscribe", icon: Bell },
];

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[9999] w-full border-b border-rollback-cream bg-rollback-light backdrop-blur supports-[backdrop-filter]:bg-rollback-light">
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
                      ? "bg-rollback-primary text-white"
                      : "text-rollback-brown hover:text-rollback-dark hover:bg-rollback-cream"
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
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === "authenticated");

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-rollback-primary hover:bg-rollback-primary/90 text-white text-sm"
                            size="sm"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                              Connect Wallet
                            </span>
                            <span className="sm:hidden">Connect</span>
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white text-sm"
                            size="sm"
                          >
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <Button
                          onClick={openAccountModal}
                          type="button"
                          className="bg-rollback-primary hover:bg-rollback-primary/90 text-white text-sm"
                          size="sm"
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">
                            {account.displayName}
                          </span>
                          <span className="sm:hidden">
                            {account.displayName}
                          </span>
                        </Button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-transparent hover:bg-rollback-cream"
                  data-mobile-menu="true"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                    <div className="w-4 h-0.5 bg-rollback-dark"></div>
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-64 bg-rollback-light border-rollback-cream z-[9999]"
              >
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
                            ? "bg-rollback-primary text-white"
                            : "text-rollback-brown hover:text-rollback-dark hover:bg-rollback-cream"
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
