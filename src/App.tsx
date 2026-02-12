import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext"; // ✅ Core Auth
import { WorkspaceProvider } from "@/contexts/WorkspaceContext"; // ✅ Workspace Logic
import DashboardLayout from "@/components/dashboard/DashboardLayout"; 
import { ProtectedRoute } from "@/components/ProtectedRoute"; 

// Preload images
import "@/assets/tradeomen-logo.png";
import "@/assets/tradeomen-icon.png";

// Lazy load pages
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* 👑 PROVIDER HIERARCHY (Critical):
      1. UserProvider: Initializes Auth & Profile.
      2. WorkspaceProvider: Depends on User, fetches Accounts.
      3. Tooltip/UI Providers: Visual components.
    */}
    <UserProvider>
      <WorkspaceProvider> 
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* --- Public Routes --- */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* --- Protected Routes --- */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/trades" element={<Trades />} />
                    <Route path="/strategies" element={<Strategies />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;