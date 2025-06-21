import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Timer,
  Eye,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "active" | "inactive" | "warning" | "success";
  description?: string;
  className?: string;
  isLoading?: boolean;
}

interface StatusCardsProps {
  totalValue?: string;
  thresholdDays?: number;
  monitoredTokens?: number;
  status?: "active" | "inactive";
  portfolio?: {
    totalValue: number;
    change24h: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  status,
  description,
  className = "",
  isLoading = false,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "from-green-500 to-green-600";
      case "inactive":
        return "from-red-500 to-red-600";
      case "warning":
        return "from-yellow-500 to-yellow-600";
      case "success":
        return "from-blue-500 to-blue-600";
      default:
        return "from-rollback-primary to-rollback-primary/80";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case "inactive":
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={`border-gray-200 bg-white hover:shadow-lg hover:shadow-rollback-primary/10 transition-all duration-300 rounded-2xl border-0 shadow-sm group ${className}`}
      style={{ height: "140px" }}
    >
      <CardContent className="p-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-xs font-medium text-gray-600 truncate">
                    {title}
                  </p>
                  {getStatusIcon()}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {value}
                    </p>
                    {trend && (
                      <Badge
                        variant={trend.isPositive ? "default" : "destructive"}
                        className={`${
                          trend.isPositive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        } px-1.5 py-0.5 text-xs flex-shrink-0`}
                      >
                        {trend.isPositive ? (
                          <TrendingUp className="h-2.5 w-2.5 mr-1" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5 mr-1" />
                        )}
                        {Math.abs(trend.value).toFixed(1)}%
                      </Badge>
                    )}
                  </div>

                  {subValue && (
                    <p className="text-xs text-gray-500 truncate">{subValue}</p>
                  )}

                  {description && (
                    <p className="text-xs text-gray-400 truncate">
                      {description}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex-shrink-0 ml-3">
            {isLoading ? (
              <Skeleton className="w-10 h-10 rounded-xl" />
            ) : (
              <div
                className={`w-10 h-10 bg-gradient-to-br ${getStatusColor()} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function EnhancedStatusCards({
  totalValue = "No tokens",
  thresholdDays = 30,
  monitoredTokens = 0,
  status = "inactive",
  portfolio,
  isLoading = false,
}: StatusCardsProps) {
  const formatTokenValue = (value: number) => {
    if (value === 0) return "No tokens";

    // For token balances, show the number with appropriate decimals
    if (value < 1) {
      return value.toFixed(4);
    } else if (value < 1000) {
      return value.toFixed(2);
    } else {
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(value);
    }
  };

  // Calculate real percentage change for today based on actual portfolio data
  const calculateDailyChange = () => {
    if (!portfolio || portfolio.totalValue === 0)
      return { value: 0, isPositive: true };

    // Use real portfolio change data only - no fallback to mock data
    const realChange = portfolio.change24h || 0;

    return {
      value: Math.abs(realChange),
      isPositive: realChange >= 0,
    };
  };

  const dailyChange = calculateDailyChange();

  const cards = [
    {
      title: "Portfolio Value",
      value: portfolio
        ? `${formatTokenValue(portfolio.totalValue)} tokens`
        : totalValue,
      subValue:
        portfolio && portfolio.totalValue > 0
          ? `${dailyChange.isPositive ? "+" : "-"}${dailyChange.value.toFixed(
              2
            )}% today`
          : "No portfolio data",
      icon: DollarSign,
      trend:
        portfolio && portfolio.totalValue > 0
          ? {
              value: dailyChange.value,
              isPositive: dailyChange.isPositive,
            }
          : undefined,
      status: (portfolio?.totalValue > 0 ? "success" : undefined) as
        | "success"
        | undefined,
      description: "Total token balance monitored",
      isLoading,
    },
    {
      title: "Threshold Period",
      value: `${thresholdDays} days`,
      subValue: "Inactivity trigger",
      icon: Timer,
      status: (status === "active" ? "active" : "inactive") as
        | "active"
        | "inactive",
      description: "Time before rollback activation",
      isLoading,
    },
    {
      title: "Monitored Assets",
      value: monitoredTokens,
      subValue: `${monitoredTokens} token${
        monitoredTokens !== 1 ? "s" : ""
      } tracked`,
      icon: Eye,
      status: (monitoredTokens > 0 ? "success" : "warning") as
        | "success"
        | "warning",
      description: "Tokens under protection",
      isLoading,
    },
    {
      title: "Protection Status",
      value: status === "active" ? "Active" : "Inactive",
      subValue: status === "active" ? "Monitoring enabled" : "Setup required",
      icon: Shield,
      status: status as "active" | "inactive",
      description: "Current rollback protection state",
      isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <StatusCard
          key={index}
          {...card}
          className="transform hover:scale-105 transition-transform duration-200"
        />
      ))}
    </div>
  );
}
