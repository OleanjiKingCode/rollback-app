import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/config/wagmi";

import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import Dashboard from "./pages/dashboard/index";
import CreateWallet from "./pages/create/index";
import Voting from "./pages/governance/index";
import Agent from "./pages/agent/index";
// import Subscribe from "./pages/subscribe/index";
import Settings from "./pages/settings/index";
import NotFound from "./pages/NotFound";
import { useState, createContext, useContext } from "react";

// Import RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

const App = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <div className="min-h-screen flex bg-gray-50">
                  <Sidebar />

                  {/* Main Content - Dynamic margin based on sidebar state */}
                  <div
                    className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
                      isCollapsed ? "lg:ml-20" : "lg:ml-72"
                    }`}
                  >
                    <main className="flex-1">
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create" element={<CreateWallet />} />
                        <Route path="/governance" element={<Voting />} />
                        <Route path="/agent" element={<Agent />} />
                        {/* <Route path="/subscribe" element={<Subscribe />} /> */}
                        <Route path="/settings" element={<Settings />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </SidebarContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
