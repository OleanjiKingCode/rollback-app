"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { SUPPORTED_CHAINS } from "@/config/wagmi";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";

interface ChainSelectorProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  showAsStackedLogos?: boolean;
}

export function ChainSelector({
  isCollapsed = false,
  isMobile = false,
  showAsStackedLogos = false,
}: ChainSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [showTestnets, setShowTestnets] = useState(false);

  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Get current chain info
  const currentChain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);

  const handleChainSelect = (chain: any) => {
    if (chain.id === chainId) {
      // Same chain selected, just close modal
      setIsModalOpen(false);
      return;
    }

    setSelectedChain(chain);
    setIsModalOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!selectedChain) return;

    try {
      await switchChain({ chainId: selectedChain.id });
      toast.success(
        "Network Switched",
        `Successfully switched to ${selectedChain.name}`
      );
      setIsConfirmOpen(false);
      setSelectedChain(null);
    } catch (error: any) {
      toast.error(
        "Switch Failed",
        error?.message || "Failed to switch network"
      );
      setIsConfirmOpen(false);
      setSelectedChain(null);
    }
  };

  const mainnets = SUPPORTED_CHAINS.filter((chain) => !chain.isTestnet);
  const testnets = SUPPORTED_CHAINS.filter((chain) => chain.isTestnet);

  const topChains = mainnets.slice(0, 3);

  if (!isConnected) {
    return null;
  }

  // Stacked logos design
  if (showAsStackedLogos) {
    return (
      <>
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative cursor-pointer group"
        >
          <div className="flex items-center">
            {topChains.map((chain, index) => (
              <div
                key={chain.id}
                className={`relative ${
                  index > 0 ? "-ml-3" : ""
                } transition-transform group-hover:scale-110`}
                style={{
                  zIndex: topChains.length - index,
                }}
              >
                <img
                  src={chain.logo}
                  alt={chain.name}
                  className={`${
                    isCollapsed ? "h-7 w-7" : "h-6 w-6"
                  } rounded-full border-2 border-white shadow-md bg-white`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                {chainId === chain.id && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#E9A344] rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chain Selection Modal - same as before */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-[95vw] max-w-lg sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col p-4 sm:p-6 bg-white">
            <DialogHeader>
              <DialogTitle>Supported Networks</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Active Network */}
              {currentChain && (
                <div className="space-y-3">
                  <div className="bg-[#E9A344]/10 border border-[#E9A344]/20 rounded-xl p-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={currentChain.logo}
                          alt={currentChain.name}
                          className="h-8 w-8 rounded-full border-2 border-[#E9A344]"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#E9A344] rounded-full border-2 border-white flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {currentChain.name}
                          </p>
                          {currentChain.isTestnet && (
                            <Badge variant="secondary" className="text-xs">
                              Testnet
                            </Badge>
                          )}
                        </div>
                        {/* <p className="text-xs text-gray-600">
                          Currently connected
                        </p> */}
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mainnets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Mainnets
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {mainnets.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {mainnets.map((chain) => (
                    <Button
                      key={chain.id}
                      onClick={() => handleChainSelect(chain)}
                      variant="ghost"
                      className={`h-20 sm:h-24 flex flex-col items-center justify-center p-2 sm:p-3 relative ${
                        chainId === chain.id
                          ? "bg-[#E9A344] text-white hover:bg-[#D4941A] ring-2 ring-[#E9A344]"
                          : "hover:bg-gray-50 border border-gray-200"
                      } rounded-xl transition-all duration-200`}
                    >
                      {chainId === chain.id && (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute top-1 right-1 sm:top-2 sm:right-2" />
                      )}
                      <img
                        src={chain.logo}
                        alt={chain.name}
                        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full mb-1 sm:mb-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="text-xs font-medium text-center truncate w-full leading-tight">
                        {chain.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Show Testnets Toggle */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={() => setShowTestnets(!showTestnets)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 transition-all duration-200 hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">
                    {showTestnets ? "Hide" : "Show"} Testnets
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {testnets.length}
                  </Badge>
                </Button>
              </div>

              {/* Testnets */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showTestnets ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Testnets
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {testnets.map((chain) => (
                      <Button
                        key={chain.id}
                        onClick={() => handleChainSelect(chain)}
                        variant="ghost"
                        className={`h-24 sm:h-28 flex flex-col items-center justify-center p-2 sm:p-3 relative ${
                          chainId === chain.id
                            ? "bg-[#E9A344] text-white hover:bg-[#D4941A] ring-2 ring-[#E9A344]"
                            : "hover:bg-gray-50 border border-gray-200"
                        } rounded-xl transition-all duration-200`}
                      >
                        {chainId === chain.id && (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute top-1 right-1 sm:top-2 sm:right-2" />
                        )}
                        <img
                          src={chain.logo}
                          alt={chain.name}
                          className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mb-1 opacity-75"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium text-center truncate w-full leading-tight">
                            {chain.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5 sm:px-2"
                          >
                            Testnet
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Switch Network</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You are about to switch from{" "}
                  <strong>{currentChain?.name}</strong> to{" "}
                  <strong>{selectedChain?.name}</strong>.
                </p>
                <p className="text-sm text-gray-600">
                  This will change your active network and may affect your
                  wallet balance display and available features.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSwitch}
                disabled={isPending}
                className="bg-[#E9A344] hover:bg-[#D4941A] text-white"
              >
                {isPending ? "Switching..." : "Switch Network"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      {/* Chain Selector Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        size="sm"
        className={`${
          isCollapsed && !isMobile ? "h-10 w-10 p-0" : "w-full"
        } border-gray-200 hover:bg-gray-50 transition-colors rounded-xl flex items-center`}
      >
        <div className="flex items-center space-x-2">
          {currentChain?.logo && (
            <img
              src={currentChain.logo}
              alt={currentChain.name}
              className="h-5 w-5 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          {(!isCollapsed || isMobile) && (
            <>
              <span className="text-sm font-medium truncate">
                {currentChain?.name || "Unknown"}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </>
          )}
        </div>
      </Button>

      {/* Chain Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col p-4 sm:p-6 bg-white">
          <DialogHeader>
            <DialogTitle>Supported Networks</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Mainnets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Mainnets</h4>
                <Badge variant="secondary" className="text-xs">
                  {mainnets.length}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {mainnets.map((chain) => (
                  <Button
                    key={chain.id}
                    onClick={() => handleChainSelect(chain)}
                    variant="ghost"
                    className={`h-20 sm:h-24 flex flex-col items-center justify-center p-2 sm:p-3 relative ${
                      chainId === chain.id
                        ? "bg-[#E9A344] text-white hover:bg-[#D4941A] ring-2 ring-[#E9A344]"
                        : "hover:bg-gray-50 border border-gray-200"
                    } rounded-xl transition-all duration-200`}
                  >
                    {chainId === chain.id && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute top-1 right-1 sm:top-2 sm:right-2" />
                    )}
                    <img
                      src={chain.logo}
                      alt={chain.name}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mb-1 sm:mb-2"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="text-xs font-medium text-center truncate w-full leading-tight">
                      {chain.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Show Testnets Toggle */}
            <div className="flex items-center justify-center">
              <Button
                onClick={() => setShowTestnets(!showTestnets)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 transition-all duration-200 hover:bg-gray-50"
              >
                <span className="text-sm font-medium">
                  {showTestnets ? "Hide" : "Show"} Testnets
                </span>
                <Badge variant="outline" className="text-xs">
                  {testnets.length}
                </Badge>
              </Button>
            </div>

            {/* Testnets */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showTestnets ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium text-gray-900">Testnets</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {testnets.map((chain) => (
                    <Button
                      key={chain.id}
                      onClick={() => handleChainSelect(chain)}
                      variant="ghost"
                      className={`h-24 sm:h-28 flex flex-col items-center justify-center p-2 sm:p-3 relative ${
                        chainId === chain.id
                          ? "bg-[#E9A344] text-white hover:bg-[#D4941A] ring-2 ring-[#E9A344]"
                          : "hover:bg-gray-50 border border-gray-200"
                      } rounded-xl transition-all duration-200`}
                    >
                      {chainId === chain.id && (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute top-1 right-1 sm:top-2 sm:right-2" />
                      )}
                      <img
                        src={chain.logo}
                        alt={chain.name}
                        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full mb-1 opacity-75"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-center truncate w-full leading-tight">
                          {chain.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0.5 sm:px-2"
                        >
                          Testnet
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Switch Network</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to switch from{" "}
                <strong>{currentChain?.name}</strong> to{" "}
                <strong>{selectedChain?.name}</strong>.
              </p>
              <p className="text-sm text-gray-600">
                This will change your active network and may affect your wallet
                balance display and available features.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSwitch}
              disabled={isPending}
              className="bg-[#E9A344] hover:bg-[#D4941A] text-white"
            >
              {isPending ? "Switching..." : "Switch Network"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
