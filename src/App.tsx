import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/web3Config';
import Router from '@/Router';
import { useEffect } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';

function App() {
  useEffect(() => {
    // Initialize Web3Modal on mount
    const initWeb3Modal = async () => {
      try {
        // Handle wallet events
        if (typeof window !== 'undefined' && window.ethereum) {
          window.ethereum.on('accountsChanged', () => {
            window.location.reload();
          });

          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

          window.ethereum.on('disconnect', () => {
            window.location.reload();
          });
        }
      } catch (error) {
        console.error('Failed to initialize Web3Modal:', error);
      }
    };

    initWeb3Modal();

    // Cleanup event listeners
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', () => {});
      }
    };
  }, []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <BrowserRouter>
        <Router />
        <Toaster />
      </BrowserRouter>
    </WagmiConfig>
  );
}

export default App;
