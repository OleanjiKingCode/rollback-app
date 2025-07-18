# Rollback Crypto Shield Integration Setup

This guide explains how to set up the integrated rollback system that connects the frontend to the **deployed backend service** and smart contracts.

## 🚀 **Backend API Integration - READY**

The frontend is now configured to use the **deployed backend service** at:

```
https://rollback-service.onrender.com/api/v1
```

## Environment Setup

**✅ The frontend is already configured** to use the deployed backend. If you need to override the default, create a `.env` file in the `rollback-crypto-shield` directory:

```bash
# Optional - Override deployed API (default is already set)
VITE_API_URL=https://rollback-service.onrender.com/api/v1

# Smart Contract Configuration
VITE_ROLLBACK_MANAGER_ADDRESS=0xbA429E21610fDFc09737a438898Dd31b0412c110
VITE_CHAIN_ID=84532                   # Base Sepolia testnet
VITE_REOWN_PROJECT_ID=your_reown_project_id
```

## 🎯 **What Happens Now When You Create a Rollback Wallet**

### **1. Smart Contract Creation** ✅

- Deploys rollback wallet on-chain
- Handles token approvals
- Manages multi-signature flow

### **2. Backend Integration** ✅

- **Automatically stores user data** in backend database
- **Enables monitoring service** to track wallet activity
- **Prepares for automated rollbacks** and email notifications

### **3. Complete Data Flow**

```
User Creates Wallet
        ↓
Smart Contract Deployment ✅
        ↓
Backend API Storage ✅
        ↓
Monitoring Service Activation ✅
        ↓
Email Notifications Ready ✅
```

## Dependencies Installation

The integration uses these dependencies (already installed):

```bash
cd rollback-crypto-shield
npm install swr viem wagmi
```

## Features Implemented

### 1. Dashboard Integration (`/dashboard`)

- **✅ Real Data Fetching**: Uses SWR to fetch user data from the deployed backend
- **✅ Contract Integration**: Checks if user has a rollback wallet on-chain
- **✅ Dynamic States**:
  - Shows wallet connection state if not connected
  - Shows "no rollback wallet" state with creation prompt
  - Shows actual dashboard with real data when wallet exists
- **✅ Backend Status**: Shows API integration status
- **✅ User Information**: Displays rollback configuration from database
- **✅ Quick Actions**: Links to governance, agent management, and notifications

### 2. Create Wallet Flow (`/create`)

- **✅ 4-Step Process**:

  1. **Basic Configuration**: Set inactivity threshold, rollback method, fallback wallet
  2. **Recovery Wallets**: Add multiple wallet addresses for multi-sig setup
  3. **Token Monitoring**: Select tokens (ERC20/ERC721) to monitor
  4. **Agent Wallet**: Automatically creates agent wallet and handles token approvals

- **✅ Smart Contract Integration**:

  - Proposes wallet creation on-chain
  - Requires signatures from all wallet owners
  - Finalizes with payment of initialization fee
  - Creates agent wallet with private key

- **✅ Backend Integration**:
  - **Stores user data** in deployed backend database
  - **Adds wallets for monitoring** by the backend service
  - **Creates agent wallet credentials** for automated operations
  - **Enables email notifications** and activity tracking

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

- **Backend Integration**:
  - `updateBackendWithWalletData()` - **✅ Stores data in deployed backend**

### 4. API Integration (`/lib/api.ts`)

SWR-based hooks for backend API integration:

- `useUser()` - Fetch user data from **deployed backend**
- `useUserWallets()` - Fetch user's monitored wallets
- `useRollbackHistory()` - Fetch rollback transaction history
- `useWalletActivity()` - Fetch wallet activity status
- `useSystemStats()` - Fetch system statistics

### 5. Custom Hooks (`/hooks/useRollback.ts`)

High-level hooks that combine API and contract interactions:

- `useRollbackWallet()` - **✅ Fetches from deployed backend + contracts**
- `useCreateRollbackWallet()` - **✅ Complete wallet creation with backend storage**
- `useTokenApprovals()` - Handle token approval process

## Backend Service Integration

### **✅ Deployed Backend Endpoints**

The frontend now calls these **live endpoints**:

- `POST https://rollback-service.onrender.com/api/v1/wallets/users` - **✅ Create user**
- `GET https://rollback-service.onrender.com/api/v1/wallets/users/:address` - **✅ Get user by address**
- `GET https://rollback-service.onrender.com/api/v1/wallets/users/:userId/wallets` - **✅ Get user wallets**
- `POST https://rollback-service.onrender.com/api/v1/wallets/users/:userId/wallets` - **✅ Add wallet**

### **✅ Backend Monitoring Service**

The deployed backend service now:

- **Monitors wallet activity** every 5 minutes
- **Sends email warnings** before rollbacks
- **Executes automated rollbacks** when thresholds are reached
- **Tracks user configurations** from frontend submissions

## 🎉 **Integration Status: COMPLETE**

### **✅ Frontend → Backend**

- User data automatically stored in deployed API
- Dashboard shows live backend integration status
- Graceful fallback to contract-only mode if backend unavailable

### **✅ Backend → Monitoring**

- Deployed service actively monitors all created wallets
- Email notifications enabled for inactivity warnings
- Automated rollback execution ready

### **✅ Smart Contracts**

- All contract interactions working
- Multi-signature wallet creation
- Token approvals and monitoring

## 🚀 **Ready to Use**

The integration is **production-ready**! Users can now:

1. **Create rollback wallets** → Automatically stored in backend
2. **Get monitored** → Backend service tracks activity
3. **Receive notifications** → Email warnings before rollbacks
4. **Automated protection** → Backend executes rollbacks when needed

**No additional setup required** - the system is fully integrated and operational! 🎯
