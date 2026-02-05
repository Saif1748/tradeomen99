import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext"; // ✅ 1. Import WorkspaceProvider
import DashboardLayout from "@/components/dashboard/DashboardLayout"; 
import { ProtectedRoute } from "@/components/ProtectedRoute"; 

// Preload images for caching
import "@/assets/tradeomen-logo.png";
import "@/assets/tradeomen-icon.png";

// Lazy load pages for better caching
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Trades = lazy(() => import("./pages/Trades"));
const Strategies = lazy(() => import("./pages/Strategies"));
const Reports = lazy(() => import("./pages/Reports"));
const Markets = lazy(() => import("./pages/Markets"));
const AIChat = lazy(() => import("./pages/AIChat"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      {/* ✅ 2. Wrap the app with WorkspaceProvider */}
      <WorkspaceProvider> 
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* --- 1. Public Routes --- */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* --- 2. Verification Route --- */}
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* --- 3. Protected Area --- */}
                <Route element={<ProtectedRoute />}>
                  
                  {/* Level 2: Layout Wrapper (Sidebar + Header) */}
                  <Route element={<DashboardLayout />}>
                    
                    {/* Level 3: The Actual Pages */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/trades" element={<Trades />} />
                    <Route path="/strategies" element={<Strategies />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                    
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;