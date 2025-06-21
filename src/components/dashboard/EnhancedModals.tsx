import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  Wallet,
  ArrowRightLeft,
  Info,
} from "lucide-react";

interface EmergencyRollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  userData?: {
    wallets: Array<{ address: string; is_obsolete: boolean }>;
    rollbackConfig: {
      threshold_seconds: number;
      fallback_wallet: string;
      monitored_tokens: Array<{ address: string; type: string }>;
    };
  };
}

interface TransactionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: number;
  totalSteps: number;
  currentAction: string;
  transactions?: Array<{
    hash?: string;
    status: "pending" | "confirmed" | "failed";
    description: string;
  }>;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  isLoading?: boolean;
}

export function EmergencyRollbackModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  userData,
}: EmergencyRollbackModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [hasReadWarning, setHasReadWarning] = useState(false);
  const requiredText = "EMERGENCY ROLLBACK";
  const isConfirmEnabled =
    confirmationText === requiredText && hasReadWarning && !isLoading;

  const activeWallets = userData?.wallets?.filter((w) => !w.is_obsolete) || [];
  const monitoredTokens = userData?.rollbackConfig?.monitored_tokens || [];
  const thresholdDays = userData?.rollbackConfig
    ? Math.ceil(userData.rollbackConfig.threshold_seconds / (24 * 60 * 60))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Zap className="h-10 w-10 text-white animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Emergency Rollback
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 leading-relaxed">
            This will immediately transfer all monitored assets to your recovery
            wallets. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              <strong>Critical Action:</strong> This will trigger an immediate
              asset transfer bypassing the {thresholdDays}-day inactivity
              threshold.
            </AlertDescription>
          </Alert>

          {/* Rollback Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-gray-600" />
              Rollback Summary
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Recovery Wallets:</span>
                  <div className="mt-1 space-y-1">
                    {activeWallets.map((wallet, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Wallet className="h-3 w-3 text-gray-400" />
                        <span className="font-mono text-xs">
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Monitored Tokens:</span>
                  <div className="mt-1 space-y-1">
                    {monitoredTokens.map((token, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="text-xs">
                          {token.type}
                        </Badge>
                        <span className="font-mono text-xs">
                          {token.address.slice(0, 6)}...
                          {token.address.slice(-4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Requirements */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="readWarning"
                checked={hasReadWarning}
                onChange={(e) => setHasReadWarning(e.target.checked)}
                className="mt-1 h-4 w-4 text-rollback-primary focus:ring-rollback-primary border-gray-300 rounded"
              />
              <label
                htmlFor="readWarning"
                className="text-sm text-gray-700 leading-relaxed"
              >
                I understand this action is immediate and irreversible. All
                monitored assets will be transferred to recovery wallets
                according to the configured rollback method.
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{requiredText}" to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type the confirmation text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initiating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Execute Emergency Rollback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionProgressModal({
  isOpen,
  onClose,
  step,
  totalSteps,
  currentAction,
  transactions = [],
}: TransactionProgressModalProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Processing Transaction
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          {/* Current Action */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 text-rollback-primary animate-spin" />
              <span className="font-medium text-gray-900">{currentAction}</span>
            </div>
          </div>

          {/* Transaction List */}
          {transactions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Transactions:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactions.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      {tx.status === "pending" && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {tx.status === "confirmed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {tx.status === "failed" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-700">
                        {tx.description}
                      </span>
                    </div>
                    {tx.hash && (
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rollback-primary hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl"
            disabled={step < totalSteps}
          >
            {step < totalSteps ? "Processing..." : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          iconBg: "from-red-500 to-red-600",
          icon: AlertTriangle,
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          iconBg: "from-yellow-500 to-yellow-600",
          icon: AlertTriangle,
          buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      default:
        return {
          iconBg: "from-rollback-primary to-rollback-primary/80",
          icon: Info,
          buttonClass:
            "bg-rollback-primary hover:bg-rollback-primary/90 text-white",
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div
            className={`w-16 h-16 bg-gradient-to-br ${styles.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-6 border-t border-gray-100 space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl ${styles.buttonClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
