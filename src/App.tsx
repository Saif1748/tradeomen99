import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout"; // 1. Import Layout

// Preload images for caching
import "@/assets/tradeomen-logo.png";
import "@/assets/tradeomen-icon.png";

// Lazy load pages for better caching
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
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
  <div className="min-h-screen bg-background" />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* 2. Global Dashboard Routes - Wrapped in Layout */}
              {/* The Sidebar will persist across all these paths */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/strategies" element={<Strategies />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/ai-chat" element={<AIChat />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;