import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Wallet, Unlink } from "lucide-react";
import { RiLoader4Line } from "react-icons/ri";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Status Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-gray-200 bg-white rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="space-y-6">
          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-40" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white rounded-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[250px] rounded-xl" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CenteredLoadingState({
  title = "Loading Dashboard",
  description = "Fetching your rollback wallet information...",
  icon = RiLoader4Line,
}: {
  title?: string;
  description?: string;
  icon?: React.ElementType;
}) {
  const Icon = icon;

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-md rounded-3xl p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Icon
              className={`h-8 w-8 text-white ${
                icon === RiLoader4Line ? "animate-spin" : ""
              }`}
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-rollback-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletConnectionState({
  isConnected,
  address,
  onConnect,
}: {
  isConnected: boolean;
  address?: string;
  onConnect?: () => void;
}) {
  if (isConnected) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-lg rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rollback-primary/10 to-rollback-secondary/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-rollback-cream to-rollback-secondary/20 rounded-full -ml-10 -mb-10" />

          <div className="relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Unlink className="h-5 w-5 text-white" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Connect Your Wallet
            </h3>

            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Connect your wallet to access rollback wallet settings.
            </p>

            <button
              onClick={onConnect}
              className="bg-gradient-to-r from-rollback-primary to-rollback-primary/90 hover:from-rollback-primary/90 hover:to-rollback-primary text-white px-4 py-2 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
            >
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Connect Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoRollbackWalletState({
  onCreateWallet,
}: {
  onCreateWallet?: () => void;
}) {
  return (
    <div className="min-h-[96vh] bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-2xl rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-brown rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Shield className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Rollback Protection Found
            </h2>

            <p className="text-gray-600 mb-8 text-base leading-relaxed">
              Secure your crypto assets with automated rollback protection.
              Never lose access to your funds due to wallet inactivity.
            </p>

            {/* Feature highlights */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                🛡️ Why Use Rollback Protection?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: "🔍",
                    title: "Activity Monitoring",
                    desc: "Automatic wallet activity tracking",
                  },
                  {
                    icon: "⚡",
                    title: "Smart Transfers",
                    desc: "Automated asset recovery system",
                  },
                  {
                    icon: "🎛️",
                    title: "Custom Settings",
                    desc: "Configurable thresholds & rules",
                  },
                  {
                    icon: "🔐",
                    title: "Multi-Sig Security",
                    desc: "Trusted wallet verification",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onCreateWallet}
              className=" bg-rollback-primary hover:bg-rollback-brown  text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
            >
              <span>Create Rollback Wallet</span>
            </button>

            <p className="text-sm text-gray-500 mt-6">
              Setup requires multiple signatures from your trusted wallets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
