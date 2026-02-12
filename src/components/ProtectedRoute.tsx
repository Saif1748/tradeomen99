import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

/**
 * 🛡️ ProtectedRoute (The Gatekeeper)
 * * Logic Flow:
 * 1. Is the Auth/Profile still loading? -> Show Industry-Grade Spinner.
 * 2. Is the user authenticated? -> If no, redirect to /auth (save attempt path).
 * 3. Is the email verified? -> If no, redirect to /verify-email.
 * 4. All good? -> Render requested page (Outlet).
 */
export const ProtectedRoute = () => {
  // ✅ FIX: Consume the centralized auth state instead of creating a new listener
  const { isAuthenticated, isEmailVerified, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    // Industry-Grade Loading State (Prevents UI flicker)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
           <p className="text-sm text-muted-foreground animate-pulse">Verifying security...</p>
        </div>
      </div>
    );
  }

  // 🛡️ Security Check 1: Authentication
  if (!isAuthenticated) {
    // We pass the current location to 'state' so the user can be 
    // redirected back to this exact page after they log in.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 🛡️ Security Check 2: Email Verification
  // We ensure they aren't stuck in a loop by checking the current path
  if (!isEmailVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // ✅ Authorization Granted
  return <Outlet />;
};