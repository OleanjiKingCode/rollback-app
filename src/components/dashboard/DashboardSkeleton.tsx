import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Status Cards Skeleton
export const StatusCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card
          key={i}
          className="border-gray-200 bg-white rounded-2xl shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="w-12 h-12 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Charts Skeleton
export const ChartsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Portfolio Chart Skeleton */}
      <Card className="border-gray-200 bg-white shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-12" />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Token Distribution Chart Skeleton */}
      <Card className="border-gray-200 bg-white shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[250px]" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Wallet Configuration Skeleton
export const WalletConfigSkeleton = () => {
  return (
    <Card className="border-gray-200 bg-white rounded-2xl">
      <CardHeader>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-3 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        <div>
          <Skeleton className="h-3 w-24 mb-1" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Recent Activity Skeleton
export const RecentActivitySkeleton = () => {
  return (
    <Card className="border-gray-200 bg-white rounded-2xl">
      <CardHeader>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-3 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50"
            >
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Header Skeleton
export const DashboardHeaderSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
      <div className="mb-4 lg:mb-0">
        <div className="flex items-center space-x-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

// Complete Dashboard Skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-0">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header Skeleton */}
        <DashboardHeaderSkeleton />

        {/* Status Cards Skeleton */}
        <div className="mb-8">
          <StatusCardsSkeleton />
        </div>

        {/* Charts Skeleton */}
        <div className="mb-8">
          <ChartsSkeleton />
        </div>

        {/* Detailed Sections Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WalletConfigSkeleton />
          <RecentActivitySkeleton />
        </div>
      </div>
    </div>
  );
};
