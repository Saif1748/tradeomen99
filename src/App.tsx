import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // Import AuthProvider
import { ProtectedRoute } from "@/components/ProtectedRoute";   // Import ProtectedRoute

// --- Analytics ---
import { PostHogProvider } from "@/providers/PostHogProvider"; 
import PageViewTracker from "@/components/PageViewTracker";   

// Preload critical assets
import "@/assets/tradeomen-logo.png";
import "@/assets/tradeomen-icon.png";

// --- Lazy Load Pages ---
// ... (Your imports remain the same) ...
const Index = lazy(() => import("./pages/Index"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Documentation = lazy(() => import("./pages/Documentation")); 
const DocArticle = lazy(() => import("./pages/DocArticle"));       

// App Pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trades = lazy(() => import("./pages/Trades"));
const Strategies = lazy(() => import("./pages/Strategies"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Markets = lazy(() => import("./pages/Markets"));
const AIChat = lazy(() => import("./pages/AIChat"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Helper to redirect authenticated users away from /auth
const AuthRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Auth />;
};

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <PostHogProvider>
        <AuthProvider> {/* Wrap everything in AuthProvider */}
          <SettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PageViewTracker />
                
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/docs" element={<Documentation />} />
                    <Route path="/docs/:slug" element={<DocArticle />} />

                    {/* Auth Route (Redirects if already logged in) */}
                    <Route path="/auth" element={<AuthRedirect />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
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
        </AuthProvider>
      </PostHogProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;