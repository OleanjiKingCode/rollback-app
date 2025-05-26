import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { mainnet, sepolia } from 'viem/chains'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '39e3c29daea8e6f80deddfda5fb0d606'

// 2. Create wagmiConfig
const metadata = {
  name: 'Rollback Crypto Shield',
  description: 'Secure your crypto assets with automated recovery',
  url: 'https://rollback.crypto',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia]
export const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains }) 