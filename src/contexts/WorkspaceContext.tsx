import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Account, UserProfile } from "@/types/account";
import { 
  getUserAccounts, 
  createAccount, 
  switchUserAccount, 
  provisionDefaultAccount 
} from "@/services/accountService";
import { toast } from "sonner";

// --- Context Type Definition ---
interface WorkspaceContextType {
  activeAccount: Account | null;
  availableAccounts: Account[];
  isLoading: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  createNewAccount: (name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  // State
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. Main Auth & Data Listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setActiveAccount(null);
        setAvailableAccounts([]);
        setIsLoading(false);
        return;
      }

      // Real-time listener on User Profile
      // This ensures if a user is invited to a team, their UI updates instantly.
      const userRef = doc(db, "users", firebaseUser.uid);
      
      const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
        // A. Handle New User (No Profile Yet)
        if (!docSnap.exists()) {
          try {
            await provisionDefaultAccount(firebaseUser.uid, firebaseUser.email!);
            // The snapshot listener will fire again after write, so we just wait
          } catch (err) {
            console.error("Auto-provisioning failed", err);
            setIsLoading(false);
          }
          return;
        }

        // B. Handle Existing User
        const profile = docSnap.data() as UserProfile;
        
        // Safety Check: If profile exists but has no accounts (edge case)
        if (!profile.joinedAccountIds || profile.joinedAccountIds.length === 0) {
           await provisionDefaultAccount(firebaseUser.uid, firebaseUser.email!);
           return;
        }

        // Fetch actual Account Documents
        try {
          const accounts = await getUserAccounts(profile.joinedAccountIds);
          setAvailableAccounts(accounts);
          
          // Determine Active Account
          // Priority: 1. Last active saved in profile -> 2. First available account
          const targetId = profile.activeAccountId || accounts[0]?.id;
          const active = accounts.find(a => a.id === targetId) || accounts[0];
          
          setActiveAccount(active);
        } catch (error) {
          console.error("Failed to load workspace data", error);
          toast.error("Failed to load workspaces");
        } finally {
          setIsLoading(false);
        }
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 2. Action Handlers ---

  const handleSwitch = async (accountId: string) => {
    if (!auth.currentUser) return;
    
    // Optimistic UI Update (Instant feel)
    const target = availableAccounts.find(a => a.id === accountId);
    if (target) setActiveAccount(target);

    try {
      await switchUserAccount(auth.currentUser.uid, accountId);
      toast.success(`Switched to ${target?.name}`);
    } catch (error) {
      toast.error("Failed to switch account");
      // Revert on error (optional, but good practice)
    }
  };

  const handleCreate = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      const newAcc = await createAccount(auth.currentUser.uid, auth.currentUser.email!, name);
      toast.success("New workspace created");
      // The snapshot listener above will automatically handle the state update
      // when the user profile is updated with the new ID.
    } catch (error) {
      console.error(error);
      toast.error("Failed to create workspace");
    }
  };

  return (
    <WorkspaceContext.Provider 
      value={{ 
        activeAccount, 
        availableAccounts, 
        isLoading, 
        switchAccount: handleSwitch,
        createNewAccount: handleCreate
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// --- Custom Hook ---
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};