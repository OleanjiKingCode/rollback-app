import { useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  AlertTriangle,
  Info,
  Wallet,
  Coins,
  Link,
  Unlink,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import {
  useTokenApprovals,
  useSimpleTokenApproval,
  useTokenData,
} from "@/hooks/contracts";
import { Address } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export default function TokenApprovals() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const {
    isConnected: hookIsConnected,
    hasRollbackWallet,
    rollbackWalletAddress,
    wallets,
    tokens,
    isLoading,
    error,
    refetchAll,
    formatTokenAmount,
  } = useTokenApprovals();

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert className="shadow-none border-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Please connect your wallet to view token approvals.</span>
            <Button onClick={openConnectModal} size="sm">
              <Link className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Token Approvals</h1>
          <p className="text-gray-600 mt-2">
            Manage token approvals for your rollback wallet system
          </p>
        </div>
        <Button onClick={refetchAll} disabled={isLoading} variant="outline">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Rollback Contract Info */}
      {rollbackWalletAddress && (
        <Alert className="shadow-none border-2">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div>
                <strong>Rollback Contract:</strong>{" "}
                <span className="font-mono text-sm break-all">
                  {rollbackWalletAddress}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  All wallets must approve their tokens to this contract for
                  rollback functionality
                </p>
              </div>
              <a
                href={`https://basescan.org/address/${rollbackWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 flex-shrink-0"
              >
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
              </a>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Currently Connected Wallet */}
      {address && (
        <Alert className="shadow-none border-2 bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <strong className="text-blue-800">
                  Connected Wallet:
                </strong>{" "}
                <span className="font-mono text-sm">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </span>
              </div>
              <Button
                onClick={() => disconnect()}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="shadow-none border-2">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading wallet and token data...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="shadow-none border-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Rollback Wallet */}
      {!isLoading && !hasRollbackWallet && (
        <Alert className="shadow-none border-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No rollback wallet found. Please create a rollback wallet first.
          </AlertDescription>
        </Alert>
      )}

      {/* No Wallets */}
      {!isLoading && hasRollbackWallet && wallets.length === 0 && (
        <Alert className="shadow-none border-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            No wallets found in your rollback system. Add wallets to your
            rollback configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* No Tokens */}
      {!isLoading &&
        hasRollbackWallet &&
        wallets.length > 0 &&
        tokens.length === 0 && (
          <Alert className="shadow-none border-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              No monitored tokens found. Add tokens to monitor in your rollback
              wallet configuration.
            </AlertDescription>
          </Alert>
        )}

      {/* Main Content */}
      {!isLoading &&
        hasRollbackWallet &&
        wallets.length > 0 &&
        tokens.length > 0 && (
          <div className="space-y-6">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.address}
                wallet={wallet}
                tokens={tokens}
                currentAddress={address}
                rollbackWalletAddress={rollbackWalletAddress}
                formatTokenAmount={formatTokenAmount}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function WalletCard({
  wallet,
  tokens,
  currentAddress,
  rollbackWalletAddress,
  formatTokenAmount,
}: {
  wallet: any;
  tokens: any[];
  currentAddress?: string;
  rollbackWalletAddress: string;
  formatTokenAmount: (amount: string, decimals?: number) => string;
}) {
  const isConnected = wallet.isConnected;
  const approvedCount = wallet.tokens.filter((t: any) => t.isApproved).length;
  const totalCount = wallet.tokens.length;
  const allApproved = approvedCount === totalCount;

  return (
    <Card
      className={`shadow-none border-2 ${
        isConnected
          ? "border-green-300 bg-green-50"
          : allApproved
          ? "border-blue-300 bg-blue-50"
          : "border-gray-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet
              className={`h-5 w-5 ${
                isConnected ? "text-green-600" : "text-gray-600"
              }`}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-lg">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </span>
                {isConnected && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    Connected
                  </Badge>
                )}
                {!isConnected && allApproved && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    All Approved
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`https://basescan.org/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
            </a>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <TokenItem
              key={token.address}
              token={token}
              walletAddress={wallet.address}
              rollbackWalletAddress={rollbackWalletAddress}
              canManage={isConnected}
              formatTokenAmount={formatTokenAmount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TokenItem({
  token,
  walletAddress,
  rollbackWalletAddress,
  canManage,
  formatTokenAmount,
}: {
  token: any;
  walletAddress: string;
  rollbackWalletAddress: string;
  canManage: boolean;
  formatTokenAmount: (amount: string, decimals?: number) => string;
}) {
  const [customAmount, setCustomAmount] = useState("");

  const tokenData = useTokenData(
    token.address as Address,
    token.type,
    walletAddress as Address
  );

  const tokenApproval = useSimpleTokenApproval(
    canManage ? (token.address as Address) : undefined,
    canManage ? token.type : undefined,
    canManage ? (rollbackWalletAddress as Address) : undefined,
    customAmount
  );

  const handleApprove = useCallback(async () => {
    if (canManage) {
      try {
        await tokenApproval.approve();
      } catch (error) {
        // Error handled by hook
      }
    }
  }, [canManage, tokenApproval.approve]);

  const handleMax = useCallback(() => {
    if (canManage) {
      const maxAmount = tokenApproval.getMaxAmount();
      const formattedAmount = formatTokenAmount(maxAmount, tokenData.decimals);
      setCustomAmount(formattedAmount);
    }
  }, [
    canManage,
    tokenApproval.getMaxAmount,
    formatTokenAmount,
    tokenData.decimals,
  ]);

  const handleRevoke = useCallback(async () => {
    if (canManage) {
      try {
        await tokenApproval.revoke();
      } catch (error) {
        // Error handled by hook
      }
    }
  }, [canManage, tokenApproval.revoke]);

  // Use real token data for display, fallback to approval hook data for connected wallet
  const symbol = tokenData.symbol;
  const name = tokenData.name;
  const balance = tokenData.balance;
  const decimals = tokenData.decimals;

  // For approval status and allowance, use the approval hook data (only available for connected wallet)
  const isApproved = canManage ? tokenApproval.isApproved : false;
  const allowance = canManage ? tokenApproval.allowance : "0";

  // Check if allowance is sufficient (for ERC20)
  const hasMaxAllowance =
    canManage && token.type === "ERC20" && BigInt(allowance) >= BigInt(balance);
  const isUnlimitedAllowance =
    canManage &&
    token.type === "ERC20" &&
    BigInt(allowance) ===
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      );

  // Use the individual loading states from the hook
  const isLoading = tokenApproval.isLoading;
  const isApproving = tokenApproval.isApproving;
  const isRevoking = tokenApproval.isRevoking;

  return (
    <div
      className={`p-4 border rounded-lg transition-all duration-200 ${
        isApproved
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      } ${isLoading ? "opacity-95" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium">{symbol}</h4>
            <Badge variant="outline" className="text-xs">
              {token.type}
            </Badge>
            {isApproved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {!isApproved && <XCircle className="h-4 w-4 text-red-500" />}
            {/* Loading indicator next to token info */}
            {isLoading && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span className="text-xs font-medium">
                  {isApproving ? "Approving" : "Revoking"}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">{name}</p>
          <div className="text-xs text-gray-500 mt-1">
            <div>
              Balance: {formatTokenAmount(balance, decimals)} {symbol}
            </div>
            {token.type === "ERC20" && canManage && (
              <div>
                Allowance:{" "}
                {isUnlimitedAllowance
                  ? "Unlimited"
                  : formatTokenAmount(allowance, decimals)}{" "}
                {symbol}
                {hasMaxAllowance && !isUnlimitedAllowance && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Sufficient
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <a
          href={`https://basescan.org/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="sm" variant="outline">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
      </div>

      <Separator className="my-3" />

      {canManage ? (
        <div className="space-y-3">
          {!hasMaxAllowance && !isUnlimitedAllowance && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {token.type === "ERC20"
                  ? "Approval Amount"
                  : "Approve All NFTs"}
              </Label>
              {token.type === "ERC20" && (
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder={`0.00 ${symbol}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={isApproving}
                    className={`flex-1 transition-colors duration-200 ${
                      isApproving ? "bg-gray-100" : ""
                    }`}
                  />
                  <Button
                    onClick={handleMax}
                    disabled={isApproving}
                    size="sm"
                    variant="outline"
                    className="transition-all duration-200"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Max"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!hasMaxAllowance && !isUnlimitedAllowance && (
              <Button
                onClick={handleApprove}
                disabled={
                  isApproving || (token.type === "ERC20" && !customAmount)
                }
                size="sm"
                className={`
                  relative transition-all duration-200 min-w-[120px] text-white
                  ${
                    isApproving
                      ? "bg-blue-500 hover:bg-blue-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
              >
                <div className="flex items-center justify-center">
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <span>Approve</span>
                    </>
                  )}
                </div>
              </Button>
            )}

            {/* Enhanced Revoke button - show if any allowance > 0 */}
            {canManage &&
              token.type === "ERC20" &&
              allowance &&
              BigInt(allowance) > BigInt(0) && (
                <Button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  size="sm"
                  variant="destructive"
                  className={`
                  relative transition-all duration-200 min-w-[120px] text-white
                  ${
                    isRevoking
                      ? "bg-red-500 hover:bg-red-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }
                `}
                >
                  <div className="flex items-center justify-center">
                    {isRevoking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Revoking...</span>
                      </>
                    ) : (
                      <>
                        <span>Revoke</span>
                      </>
                    )}
                  </div>
                </Button>
              )}

            {/* For ERC721, show revoke if approved */}
            {canManage && token.type === "ERC721" && isApproved && (
              <Button
                onClick={handleRevoke}
                disabled={isRevoking}
                size="sm"
                variant="destructive"
                className={`
                  relative transition-all duration-200 min-w-[120px] text-white
                  ${
                    isRevoking
                      ? "bg-red-500 hover:bg-red-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }
                `}
              >
                <div className="flex items-center justify-center">
                  {isRevoking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <span>Revoke</span>
                    </>
                  )}
                </div>
              </Button>
            )}

            {/* Status Badge for allowance levels */}
            {canManage &&
              token.type === "ERC20" &&
              allowance &&
              BigInt(allowance) > BigInt(0) && (
                <Badge
                  className={`px-3 py-1 ${
                    isUnlimitedAllowance
                      ? "bg-green-100 text-green-800 border-green-200"
                      : hasMaxAllowance
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isUnlimitedAllowance
                    ? "Unlimited"
                    : hasMaxAllowance
                    ? "Sufficient"
                    : "Partial"}
                </Badge>
              )}

            {/* Status Badge for ERC721 */}
            {canManage && token.type === "ERC721" && isApproved && (
              <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
          </div>

          {tokenApproval.error && !isLoading && (
            <Alert variant="destructive" className="shadow-none border">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Transaction failed:</strong>{" "}
                {tokenApproval.error.message || "Unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <Alert className="shadow-none border border-yellow-300 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            Connect to this wallet to manage approvals
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
