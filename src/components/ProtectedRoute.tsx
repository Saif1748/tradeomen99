import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom"; // 1. Added useLocation
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation(); // 2. Get current path

  useEffect(() => {
    // 3. Real-time listener for Auth State
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    // 4. Loading State (prevents flash of content)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
           <p className="text-sm text-muted-foreground animate-pulse">Verifying security...</p>
        </div>
      </div>
    );
  }

  // 5. Security Check 1: Is the user logged in?
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 6. Security Check 2: Is the email verified?
  // If not verified, kick them to the verification page
  // (We add a check to ensure we aren't already there to prevent infinite loops)
  if (!user.emailVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // 7. All checks passed -> Render the protected page
  return <Outlet />;
};