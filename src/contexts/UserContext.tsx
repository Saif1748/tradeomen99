import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

// 1. ⚡ AUTO-INFERENCE: Automatically matches the return type of your hook.
// This ensures the Context is ALWAYS in sync with the hook logic.
type UserContextType = ReturnType<typeof useAuth>;

// Create Context with undefined initial state (enforced by the hook below)
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * 🛡️ The Global User Provider
 * Wraps the app and initializes the Auth "Brain" (useAuth).
 */
export function UserProvider({ children }: { children: ReactNode }) {
  // Initialize the hook once at the root level
  const authState = useAuth();

  return (
    <UserContext.Provider value={authState}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * 🪝 The Consumer Hook
 * usage: const { user, profile, isPro } = useUser();
 */
export function useUser() {
  const context = useContext(UserContext);
  
  // 🛡️ Fail-Fast Check: Prevents usage outside the provider
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider. Wrap your app in <UserProvider />.");
  }
  
  return context;
}