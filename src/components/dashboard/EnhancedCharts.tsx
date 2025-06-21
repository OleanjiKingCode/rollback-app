import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";

interface ChartData {
  date: string;
  value: number;
  volume?: number;
}

interface TokenData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface EnhancedChartsProps {
  portfolioData?: ChartData[];
  tokenDistribution?: TokenData[];
  className?: string;
}

const COLORS = ["#E9A344", "#F5C678", "#8B5E3C", "#FAEBD1", "#3C2415"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 backdrop-blur-sm">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? `${entry.value.toLocaleString()} tokens`
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value.toLocaleString()} tokens ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function EnhancedCharts({
  portfolioData = [],
  tokenDistribution = [],
  className,
}: EnhancedChartsProps) {
  const [timeRange, setTimeRange] = useState("7D");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  // Mock data if none provided
  const defaultPortfolioData: ChartData[] = [
    { date: "01/01", value: 2400, volume: 1200 },
    { date: "01/02", value: 1398, volume: 980 },
    { date: "01/03", value: 9800, volume: 2100 },
    { date: "01/04", value: 3908, volume: 1850 },
    { date: "01/05", value: 4800, volume: 2200 },
    { date: "01/06", value: 3800, volume: 1900 },
    { date: "01/07", value: 4300, volume: 2400 },
  ];

  const defaultTokenData: TokenData[] = [
    { name: "USDC", value: 4000, percentage: 40, color: COLORS[0] },
    { name: "ETH", value: 3000, percentage: 30, color: COLORS[1] },
    { name: "WBTC", value: 2000, percentage: 20, color: COLORS[2] },
    { name: "DAI", value: 1000, percentage: 10, color: COLORS[3] },
  ];

  const data = portfolioData.length > 0 ? portfolioData : defaultPortfolioData;
  const tokenData =
    tokenDistribution.length > 0 ? tokenDistribution : defaultTokenData;

  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const percentChange =
    previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;
  const isPositive = percentChange >= 0;

  const timeRanges = ["24H", "7D", "30D", "90D", "1Y"];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Overview Chart */}
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                Portfolio Overview
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-gray-900">
                  {currentValue.toLocaleString()} tokens
                </span>
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className={`${
                    isPositive
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  } px-2 py-1`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(percentChange).toFixed(2)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={chartType === "line" ? "default" : "ghost"}
                  onClick={() => setChartType("line")}
                  className="h-8 px-3 text-xs"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Line
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "area" ? "default" : "ghost"}
                  onClick={() => setChartType("area")}
                  className="h-8 px-3 text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Area
                </Button>
              </div>

              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {timeRanges.map((range) => (
                  <Button
                    key={range}
                    size="sm"
                    variant={timeRange === range ? "default" : "ghost"}
                    onClick={() => setTimeRange(range)}
                    className="h-8 px-3 text-xs"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E9A344" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#E9A344"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#E9A344"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#E9A344"
                    strokeWidth={3}
                    dot={{ fill: "#E9A344", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#E9A344", strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Token Distribution Chart */}
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <PieChartIcon className="h-5 w-5 text-rollback-primary" />
            <span>Token Distribution</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tokenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {tokenData.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: token.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {token.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {token.value.toLocaleString()} tokens
                    </div>
                    <div className="text-sm text-gray-500">
                      {token.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
