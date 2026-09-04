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
import PlanningPage from "./pages/Planning/PlanningPage";
import SwiggyPartnerDashboard from "./pages/Partner/SwiggyPartnerDashboard";
import CohortPlanner from "./pages/Planning/CohortPlanner";

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
              {/* New Planning page as first/index page (light theme, standalone) */}
              <Route path="/" element={<PlanningPage />} />

              {/* Partner usage dashboard (light theme, standalone) */}
              <Route path="/partners/swiggy" element={<SwiggyPartnerDashboard />} />

              {/* Cohort planner (Ask The Cohort. Know The Scale.) */}
              <Route path="/planner" element={<CohortPlanner />} />


              {/* Netflix-themed app routes wrapped in Layout */}
              <Route element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
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
