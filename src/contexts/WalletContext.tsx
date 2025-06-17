import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { appKit } from "@/config/wallet";

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to account changes
    const unsubscribeAccount = appKit.subscribeAccount((account) => {
      setAddress(account.address || null);
      setIsConnected(!!account.address);
      setIsConnecting(false);
    });

    // Subscribe to state changes
    const unsubscribeState = appKit.subscribeState((state) => {
      setIsConnecting(state.loading);
    });

    return () => {
      unsubscribeAccount();
      unsubscribeState();
    };
  }, []);

  const connect = () => {
    setIsConnecting(true);
    appKit.open();
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await appKit.disconnect();
      setIsConnected(false);
      setAddress(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        isDisconnecting,
        address,
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
