
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SavedAudiencesProvider } from "./contexts/SavedAudiencesContext";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin/Admin";
import Segmentation from "./pages/Segmentation/Segmentation";
import Enrichment from "./pages/Enrichment";
import Activation from "./pages/Activation";
import NotFound from "./pages/NotFound";
import './index.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SavedAudiencesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="admin/*" element={<Admin />} />
                <Route path="segmentation/*" element={<Segmentation />} />
                <Route path="enrichment/*" element={<Enrichment />} />
                <Route path="activation/*" element={<Activation />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SavedAudiencesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
