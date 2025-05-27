
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: InstanceType<typeof EthereumProvider> | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<InstanceType<typeof EthereumProvider> | null>(null);

  const projectId = '39e3c29daea8e6f80deddfda5fb0d606';

  useEffect(() => {
    const initProvider = async () => {
      try {
        const walletConnectProvider = await EthereumProvider.init({
          projectId,
          chains: [1], // Ethereum mainnet
          showQrModal: true,
          metadata: {
            name: 'Rollback Wallet',
            description: 'Rollback Crypto Shield',
            url: window.location.origin,
            icons: ['https://walletconnect.com/walletconnect-logo.png']
          }
        });

        setProvider(walletConnectProvider);

        // Check for existing session
        if (walletConnectProvider.accounts.length > 0) {
          setIsConnected(true);
          setAddress(walletConnectProvider.accounts[0]);
        }

        // Listen for account changes
        walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });

        // Listen for disconnect
        walletConnectProvider.on('disconnect', () => {
          setIsConnected(false);
          setAddress(null);
        });

      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
      }
    };

    initProvider();
  }, []);

  const connect = async () => {
    if (!provider) {
      console.error('Provider not initialized');
      return;
    }

    try {
      const accounts = await provider.connect();
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setIsConnected(false);
      setAddress(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect,
        disconnect,
        provider
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
