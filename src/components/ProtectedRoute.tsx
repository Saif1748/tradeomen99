import React, { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-Auth";

interface ProtectedRouteProps {
  /**
   * Making children optional allows ProtectedRoute to be used as a 
   * Layout Route in App.tsx (using the Outlet pattern).
   */
  children?: ReactNode;
}

/**
 * ProtectedRoute
 * Shields routes by requiring both a Supabase session and a successful Backend Profile sync.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading, profile, error } = useAuth();
  const location = useLocation();

  // 1. Loading state during initialization or sync
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <svg 
          className="w-10 h-10 animate-spin text-primary mb-4" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p className="text-muted-foreground animate-pulse text-sm">
          Syncing secure session...
        </p>
      </div>
    );
  }

  // 2. Not logged in via Supabase
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Backend Error: Supabase is OK, but Python Backend failed
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg 
              className="w-6 h-6 text-red-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Engine Connection Error</h2>
          <p className="text-muted-foreground text-sm">
            We authenticated your identity, but could not connect to the TradeOmen analysis engine. 
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 4. Success state
   * If children exist (standard wrapper usage), render them.
   * Otherwise, render Outlet (for Layout Route usage in App.tsx).
   */
  return children ? <>{children}</> : <Outlet />;
};