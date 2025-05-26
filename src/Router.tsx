import { Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Dashboard from "./pages/dashboard";
import CreateWallet from "./pages/create";
import Governance from "./pages/governance";
import Agent from "./pages/agent";
import Subscribe from "./pages/subscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Router = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <div className="min-h-screen flex flex-col bg-rollback-light">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateWallet />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/subscribe" element={<Subscribe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default Router; 