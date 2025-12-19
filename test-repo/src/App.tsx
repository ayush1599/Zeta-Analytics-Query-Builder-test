import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import QueryGenerator from "./pages/QueryGenerator";
import Studio from "./pages/Studio";
import ZigsDataTransfer from "./pages/ZigsDataTransfer";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { ResetPassword } from "./pages/ResetPassword";
import AuthGate from "./components/AuthGate";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/" element={<AuthGate><Homepage /></AuthGate>} />
            <Route path="/query-generator" element={<AuthGate><QueryGenerator /></AuthGate>} />
            <Route path="/studio" element={<AuthGate><Studio /></AuthGate>} />
            <Route path="/zigs-data-transfer" element={<AuthGate><ZigsDataTransfer /></AuthGate>} />
            <Route path="/history" element={<AuthGate><History /></AuthGate>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
