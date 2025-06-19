export interface User {
  id: string;
  address: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface RollbackConfig {
  id: string;
  user_id: string;
  inactivity_threshold: number;
  rollback_method: string;
  fallback_wallet: string;
  agent_wallet: string;
  rollback_wallet_address: string;
  tokens_to_monitor: Array<{
    type: string;
    address: string;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  priority_position: number;
  is_obsolete: boolean;
  last_activity: string;
  balance_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  id: string;
  address: string;
  symbol: string;
  name: string;
  tokenType: "ERC20" | "ERC721";
  decimals?: number;
  isActive: boolean;
}

export interface RollbackHistory {
  id: string;
  userId: string;
  fromWallet: string;
  toWallet: string;
  transactionHash?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface WalletActivity {
  walletAddress: string;
  lastActivity: string;
  isEligibleForRollback: boolean;
  timeUntilEligible?: number;
}

export interface SystemStats {
  totalUsers: number;
  totalWallets: number;
  totalRollbacks: number;
  activeMonitoring: number;
}

// Contract specific types
export interface CreateWalletParams {
  user: string;
  wallets: string[];
  threshold: number;
  tokensToMonitor: string[];
  tokenTypes: number[];
  isRandomized: boolean;
  fallbackWallet: string;
  agentWallet: string;
}

export interface CreationRequest {
  requestId: number;
  params: CreateWalletParams;
  signers: string[];
  executed: boolean;
  signatureCount: number;
}

export interface RollbackWalletConfig {
  threshold: number;
  isRandomized: boolean;
  fallbackWallet: string;
  agentWallet: string;
  treasuryAddress: string;
}

export interface WalletInfo {
  walletAddress: string;
  lastActivity: number;
  isObsolete: boolean;
  nextWalletInLine: string;
}

export interface TokenToMonitor {
  tokenAddress: string;
  tokenType: number;
  isActive: boolean;
}

export interface Vote {
  voteId: number;
  voteType: number;
  targetAddress: string;
  targetValue: number;
  initiator: string;
  approvalsReceived: number;
  expirationTime: number;
  executed: boolean;
}

export interface CreateWalletFormData {
  wallets: string[];
  threshold: number;
  tokensToMonitor: Array<{
    address: string;
    type: "ERC20" | "ERC721";
  }>;
  isRandomized: boolean;
  fallbackWallet: string;
}

export interface AgentWallet {
  id: string;
  userId: string;
  address: string;
  createdAt: string;
}

// Complete API response structure
export interface UserData {
  user: User;
  wallets: Wallet[];
  rollbackConfig: RollbackConfig;
  agentWallet: AgentWallet;
}
