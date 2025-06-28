export const ROLLBACK_MANAGER_ABI = [
  // Read functions
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "hasRollbackWallet",
    outputs: [
      { name: "hasWallet", type: "bool" },
      { name: "walletAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "getCreationRequest",
    outputs: [
      {
        components: [
          { name: "requestId", type: "uint256" },
          {
            components: [
              { name: "user", type: "address" },
              { name: "wallets", type: "address[]" },
              { name: "threshold", type: "uint256" },
              { name: "tokensToMonitor", type: "address[]" },
              { name: "tokenTypes", type: "uint8[]" },
              { name: "isRandomized", type: "bool" },
              { name: "fallbackWallet", type: "address" },
              { name: "agentWallet", type: "address" },
            ],
            name: "params",
            type: "tuple",
          },
          { name: "signers", type: "address[]" },
          { name: "executed", type: "bool" },
          { name: "signatureCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCreationRequests",
    outputs: [
      { name: "ids", type: "uint256[]" },
      {
        components: [
          { name: "requestId", type: "uint256" },
          {
            components: [
              { name: "user", type: "address" },
              { name: "wallets", type: "address[]" },
              { name: "threshold", type: "uint256" },
              { name: "tokensToMonitor", type: "address[]" },
              { name: "tokenTypes", type: "uint8[]" },
              { name: "isRandomized", type: "bool" },
              { name: "fallbackWallet", type: "address" },
              { name: "agentWallet", type: "address" },
            ],
            name: "params",
            type: "tuple",
          },
          { name: "signers", type: "address[]" },
          { name: "executed", type: "bool" },
          { name: "signatureCount", type: "uint256" },
        ],
        name: "requests",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getInitializationFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      {
        components: [
          { name: "user", type: "address" },
          { name: "wallets", type: "address[]" },
          { name: "threshold", type: "uint256" },
          { name: "tokensToMonitor", type: "address[]" },
          { name: "tokenTypes", type: "uint8[]" },
          { name: "isRandomized", type: "bool" },
          { name: "fallbackWallet", type: "address" },
          { name: "agentWallet", type: "address" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "proposeWalletCreation",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "signWalletCreation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "finalizeWalletCreation",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "requestId", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      {
        indexed: false,
        components: [
          { name: "user", type: "address" },
          { name: "wallets", type: "address[]" },
          { name: "threshold", type: "uint256" },
          { name: "tokensToMonitor", type: "address[]" },
          { name: "tokenTypes", type: "uint8[]" },
          { name: "isRandomized", type: "bool" },
          { name: "fallbackWallet", type: "address" },
          { name: "agentWallet", type: "address" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "WalletCreationProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "requestId", type: "uint256" },
      { indexed: true, name: "signer", type: "address" },
    ],
    name: "WalletCreationSigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "wallet", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "WalletCreated",
    type: "event",
  },
] as const;

export const ROLLBACK_WALLET_ABI = [
  // Read functions
  {
    inputs: [],
    name: "getSystemConfig",
    outputs: [
      { name: "threshold", type: "uint256" },
      { name: "isRandomized", type: "bool" },
      { name: "fallbackWallet", type: "address" },
      { name: "agentWallet", type: "address" },
      { name: "treasuryAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllWallets",
    outputs: [
      {
        components: [
          { name: "walletAddress", type: "address" },
          { name: "lastActivity", type: "uint256" },
          { name: "priorityPosition", type: "uint256" },
          { name: "isObsolete", type: "bool" },
          { name: "nextWalletInLine", type: "address" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokensToMonitor",
    outputs: [
      {
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "tokenType", type: "uint8" },
          { name: "isActive", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMonitoredTokens",
    outputs: [
      { name: "tokens", type: "address[]" },
      { name: "types", type: "uint8[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEligibleWallets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllVotes",
    outputs: [
      {
        components: [
          { name: "voteId", type: "uint256" },
          { name: "voteType", type: "uint8" },
          { name: "targetAddress", type: "address" },
          { name: "targetValue", type: "uint256" },
          { name: "initiator", type: "address" },
          { name: "approvalsReceived", type: "uint256" },
          { name: "expirationTime", type: "uint256" },
          { name: "executed", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "voteType", type: "uint8" },
      { name: "targetAddress", type: "address" },
      { name: "targetValue", type: "uint256" },
    ],
    name: "requestVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "voteId", type: "uint256" },
      { name: "approve", type: "bool" },
    ],
    name: "confirmVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "walletAddress", type: "address" }],
    name: "resetActivity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "wallets", type: "address[]" },
      { name: "randomSeed", type: "uint256" },
    ],
    name: "performRollback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC721_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Token types enum
export enum TOKEN_TYPE {
  ERC20 = 0,
  ERC721 = 1,
}

// Vote types enum
export enum VOTE_TYPE {
  AGENT_CHANGE = 0,
  THRESHOLD_CHANGE = 1,
  OBSOLETE_WALLET = 2,
}
