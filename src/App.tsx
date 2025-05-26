import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/web3Config';
import Router from '@/Router';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize Web3Modal on mount
    const initWeb3Modal = async () => {
      try {
        // Force a page reload if we detect a wallet change
        window.ethereum?.on('accountsChanged', () => {
          window.location.reload();
        });

        window.ethereum?.on('chainChanged', () => {
          window.location.reload();
        });
      } catch (error) {
        console.error('Failed to initialize Web3Modal:', error);
      }
    };

    initWeb3Modal();
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
