import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/web3Config';
import Router from '@/Router';

function App() {
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
