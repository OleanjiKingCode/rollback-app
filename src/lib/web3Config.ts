import { defaultWagmiConfig } from '@web3modal/wagmi/react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { walletConnectProvider, EIP6963Connector } from '@web3modal/wagmi'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { mainnet, sepolia } from 'viem/chains'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '39e3c29daea8e6f80deddfda5fb0d606'

// 2. Create metadata object
const metadata = {
  name: 'Rollback Crypto Shield',
  description: 'Secure your crypto assets with automated recovery',
  url: 'https://preview--rollback-crypto-shield.lovable.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 3. Create wagmiConfig
const chains = [mainnet, sepolia] as const

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  connectors: [
    new WalletConnectConnector({ 
      chains,
      options: { 
        projectId,
        showQrModal: true,
        metadata 
      } 
    }),
    new InjectedConnector({ 
      chains,
      options: { 
        shimDisconnect: true,
        name: 'Injected'
      } 
    }),
    new CoinbaseWalletConnector({ 
      chains,
      options: { 
        appName: metadata.name,
      } 
    }),
    new EIP6963Connector({ chains })
  ]
})

// 4. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  defaultChain: mainnet,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#E9A344',
    '--w3m-border-radius-master': '0.5rem',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ]
})

export { wagmiConfig } 