"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  Vote,
  Bot,
  Mail,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Copy,
} from "lucide-react";
import { useSidebarContext } from "@/App";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Create Wallet", href: "/create", icon: PlusCircle },
  { name: "Governance", href: "/governance", icon: Vote },
  { name: "Wallet Agent", href: "/agent", icon: Bot },
  { name: "Subscribe", href: "/subscribe", icon: Mail },
];

export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebarContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, isConnected, connect, disconnect } = useWallet();
  const { toast } = useToast();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const NavContent = ({ isMobile = false }) => (
    <div
      className={`flex flex-col h-full gap-4 ${
        isMobile ? "!bg-[#F9F3E5]" : "bg-rollback-light"
      }`}
      style={isMobile ? { backgroundColor: "#F9F3E5" } : undefined}
    >
      {/* Header with Original Logo */}
      <div
        onClick={() => (isCollapsed && !isMobile ? setIsCollapsed(false) : {})}
        className={`flex items-center py-3 bg-rollback-light ${
          isCollapsed && !isMobile
            ? "justify-center px-2"
            : "justify-between px-6"
        }`}
      >
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/86a7596b-4477-45a7-88bb-9de6bbadd014.png"
              alt="Rollback Wallet"
              className="h-10 w-10 rounded-xl"
            />
            <span className="text-xl font-bold text-gray-900">Rollback</span>
          </div>
        )}

        {isCollapsed && !isMobile && (
          <div onClick={() => setIsCollapsed(false)}>
            <img
              src="/lovable-uploads/86a7596b-4477-45a7-88bb-9de6bbadd014.png"
              alt="Rollback Wallet"
              className="h-10 w-10 rounded-xl"
            />
          </div>
        )}

        {!isMobile && !isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-[#E9A344] text-white shadow-lg shadow-[#E9A344]/25"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                } flex-shrink-0`}
              />
              {(!isCollapsed || isMobile) && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet Connection with Copy Button */}
      <div
        className={`p-4 border-t border-gray-200 ${
          isCollapsed && !isMobile ? "px-2" : ""
        }`}
      >
        {isConnected ? (
          <div
            className={`space-y-3 ${
              isCollapsed && !isMobile ? "space-y-2" : ""
            }`}
          >
            {(!isCollapsed || isMobile) && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {formatAddress(address!)}
                </p>
              </div>
            )}

            <div
              className={`flex ${
                isCollapsed && !isMobile ? "flex-col space-y-2" : "space-x-2"
              }`}
            >
              {(!isCollapsed || isMobile) && (
                <Button
                  onClick={handleCopyAddress}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}

              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className={`${
                  isCollapsed && !isMobile
                    ? "h-10 w-10 p-0"
                    : !isCollapsed || isMobile
                    ? "flex-1"
                    : "w-full"
                } border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors rounded-xl`}
              >
                <LogOut
                  className={`h-4 w-4 ${
                    !isCollapsed || isMobile ? "mr-2" : ""
                  }`}
                />
                {(!isCollapsed || isMobile) && "Disconnect"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => connect()}
            className={`w-full ${
              isCollapsed && !isMobile ? "h-10 w-10 p-0" : ""
            } bg-[#E9A344] hover:bg-[#D4941A] text-white transition-colors rounded-xl`}
          >
            <Wallet
              className={`h-4 w-4 ${!isCollapsed || isMobile ? "mr-2" : ""}`}
            />
            {(!isCollapsed || isMobile) && "Connect Wallet"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 ${
          isCollapsed ? "lg:w-20" : "lg:w-72"
        } transition-all duration-300 ease-in-out fixed left-0 top-0 h-full z-30`}
      >
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-0 !bg-[#F9F3E5]"
            style={{ backgroundColor: "#F9F3E5" }}
          >
            <NavContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
