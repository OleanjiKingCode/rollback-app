# Rollback Crypto Shield Integration Setup

This guide explains how to set up the integrated rollback system that connects the frontend to the backend service and smart contracts.

## Environment Setup

1. Create a `.env` file in the `rollback-crypto-shield` directory:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_ROLLBACK_MANAGER_ADDRESS=0x...  # Your deployed RollbackWalletManager contract address
VITE_CHAIN_ID=84532                   # Base Sepolia testnet
VITE_REOWN_PROJECT_ID=your_reown_project_id
```

## Dependencies Installation

The integration adds several new dependencies:

```bash
cd rollback-crypto-shield
npm install swr viem wagmi
```

## Features Implemented

### 1. Dashboard Integration (`/dashboard`)

- **Real Data Fetching**: Uses SWR to fetch user data from the rollback backend
- **Contract Integration**: Checks if user has a rollback wallet on-chain
- **Dynamic States**:
  - Shows wallet connection state if not connected
  - Shows "no rollback wallet" state with creation prompt
  - Shows actual dashboard with real data when wallet exists
- **User Information**: Displays rollback configuration from database
- **Quick Actions**: Links to governance, agent management, and notifications

### 2. Create Wallet Flow (`/create`)

- **4-Step Process**:

  1. **Basic Configuration**: Set inactivity threshold, rollback method, fallback wallet
  2. **Recovery Wallets**: Add multiple wallet addresses for multi-sig setup
  3. **Token Monitoring**: Select tokens (ERC20/ERC721) to monitor
  4. **Agent Wallet**: Automatically creates agent wallet and handles token approvals

- **Smart Contract Integration**:

  - Proposes wallet creation on-chain
  - Requires signatures from all wallet owners
  - Finalizes with payment of initialization fee
  - Creates agent wallet with private key

- **Backend Integration**:
  - Stores user data in database
  - Adds wallets for monitoring
  - Creates agent wallet credentials

### 3. Contract Service (`/lib/contracts.ts`)

Comprehensive smart contract interaction service with methods for:

- **RollbackWalletManager Contract**:

  - `hasRollbackWallet()` - Check if user has rollback wallet
  - `proposeWalletCreation()` - Propose new wallet creation
  - `signWalletCreation()` - Sign wallet creation proposal
  - `finalizeWalletCreation()` - Complete wallet creation with payment

- **RollbackWallet Contract**:

  - `getSystemConfig()` - Get wallet configuration
  - `getAllWallets()` - Get all monitored wallets
  - `getTokensToMonitor()` - Get monitored tokens
  - `requestVote()` - Request governance vote
  - `confirmVote()` - Confirm governance vote
  - `performRollback()` - Execute rollback operation

- **Token Approvals**:
  - `approveERC20()` - Approve ERC20 tokens for monitoring
  - `approveERC721()` - Approve ERC721 tokens for monitoring

### 4. API Integration (`/lib/api.ts`)

SWR-based hooks for backend API integration:

- `useUser()` - Fetch user data
- `useUserWallets()` - Fetch user's monitored wallets
- `useRollbackHistory()` - Fetch rollback transaction history
- `useWalletActivity()` - Fetch wallet activity status
- `useSystemStats()` - Fetch system statistics

### 5. Custom Hooks (`/hooks/useRollback.ts`)

High-level hooks that combine API and contract interactions:

- `useRollbackWallet()` - Check for existing rollback wallet
- `useCreateRollbackWallet()` - Complete wallet creation flow
- `useTokenApprovals()` - Handle token approval process

### 6. Context Providers

- **ContractProvider**: Provides ethers.js provider and contract service
- **WalletProvider**: Enhanced with contract integration

## Backend Service Requirements

The frontend expects these API endpoints to be available:

- `POST /wallets/users` - Create user
- `GET /wallets/users/:address` - Get user by address
- `GET /wallets/users/:userId/wallets` - Get user wallets
- `POST /wallets/users/:userId/wallets` - Add wallet
- `POST /wallets/agent/create` - Create agent wallet
- `PUT /wallets/users/:userId/rollback-config` - Update config
- More endpoints as defined in the API service

## Smart Contract Requirements

The frontend interacts with two main contracts:

1. **RollbackWalletManager**: Factory contract for creating rollback wallets
2. **RollbackWallet**: Individual rollback wallet instances

Both contracts must be deployed and the manager address configured in environment variables.

## Running the Integrated System

1. **Start Backend Service**:

   ```bash
   cd rollback-backend
   npm run start:dev
   ```

2. **Start Frontend**:

   ```bash
   cd rollback-crypto-shield
   npm run dev
   ```

3. **Connect Wallet**: Use a Web3 wallet (MetaMask, etc.) to connect

4. **Create Rollback Wallet**: Follow the 4-step creation process

## Key Integration Points

1. **Real-time Data**: Dashboard shows actual on-chain and database data
2. **Multi-signature Support**: Creation process requires signatures from all wallet owners
3. **Token Monitoring**: Supports both ERC20 and ERC721 tokens
4. **Agent Automation**: Creates automated agent wallet for rollback execution
5. **Error Handling**: Comprehensive error states and user feedback
6. **Loading States**: Proper loading indicators throughout the flow

The integration is now complete and provides a fully functional rollback protection system!
