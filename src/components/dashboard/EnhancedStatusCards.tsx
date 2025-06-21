import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {getStatusIcon()}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {trend && (
                  <Badge
                    variant={trend.isPositive ? "default" : "destructive"}
                    className={`${
                      trend.isPositive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    } px-2 py-1 text-xs`}
                  >
                    {trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(trend.value).toFixed(1)}%
                  </Badge>
                )}
              </div>

              {subValue && <p className="text-sm text-gray-500">{subValue}</p>}

              {description && (
                <p className="text-xs text-gray-400 mt-2">{description}</p>
              )}
            </div>
          </div>

          <div
            className={`w-12 h-12 bg-gradient-to-br ${getStatusColor()} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
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

  const cards = [
    {
      title: "Portfolio Value",
      value: portfolio
        ? `${formatTokenValue(portfolio.totalValue)} tokens`
        : totalValue,
      subValue: portfolio
        ? `${portfolio.change24h >= 0 ? "+" : ""}${portfolio.change24h.toFixed(
            2
          )}% today`
        : undefined,
      icon: DollarSign,
      trend: portfolio
        ? {
            value: portfolio.change24h,
            isPositive: portfolio.isPositive,
          }
        : undefined,
      status: portfolio?.totalValue > 0 ? "success" : undefined,
      description: "Total token balance monitored",
    },
    {
      title: "Threshold Period",
      value: `${thresholdDays} days`,
      subValue: "Inactivity trigger",
      icon: Timer,
      status: status === "active" ? "active" : "inactive",
      description: "Time before rollback activation",
    },
    {
      title: "Monitored Assets",
      value: monitoredTokens,
      subValue: `${monitoredTokens} token${
        monitoredTokens !== 1 ? "s" : ""
      } tracked`,
      icon: Eye,
      status: monitoredTokens > 0 ? "success" : "warning",
      description: "Tokens under protection",
    },
    {
      title: "Protection Status",
      value: status === "active" ? "Active" : "Inactive",
      subValue: status === "active" ? "Monitoring enabled" : "Setup required",
      icon: Shield,
      status: status,
      description: "Current rollback protection state",
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
