import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account } from "@/types/account";
import { 
  createAccount, 
  switchUserAccount, 
} from "@/services/accountService";
import { useUser } from "@/contexts/UserContext"; // ✅ Consume UserContext
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // ✅ 1. Get User State from our Industry-Grade Hook
  const { user, profile } = useUser();
  
  // --- State ---
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 2. Accounts Listener ---
  useEffect(() => {
    // If no user, reset state
    if (!user) {
      setAvailableAccounts([]);
      setActiveAccount(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 📡 Real-time Listener for Accounts
    // Queries only accounts where the user is a member
    const q = query(
      collection(db, "accounts"), 
      where("memberIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Account));

      setAvailableAccounts(accounts);
      setIsLoading(false);
    }, (error) => {
      console.error("Workspace sync error:", error);
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, [user?.uid]); // Re-run only if user changes

  // --- 3. Active Account Logic ---
  // Syncs the "Active" account based on User Profile preference + Available Accounts
  useEffect(() => {
    if (availableAccounts.length === 0) {
      setActiveAccount(null);
      return;
    }

    // A. User has a preferred account in their profile?
    const preferredId = profile?.activeAccountId;
    
    // B. Find that account in the loaded list
    let target = availableAccounts.find(a => a.id === preferredId);

    // C. Fallback: If preference is invalid or missing, default to the first one
    if (!target) {
      target = availableAccounts[0];
    }

    setActiveAccount(target);
    
  }, [availableAccounts, profile?.activeAccountId]);

  // --- 4. Action Handlers ---

  const handleSwitch = async (accountId: string) => {
    if (!user) return;
    
    // Optimistic UI Update handled by local state in components usually,
    // but here we wait for the server to confirm the profile update.
    try {
      await switchUserAccount(user.uid, accountId);
      const targetName = availableAccounts.find(a => a.id === accountId)?.name;
      toast.success(`Switched to ${targetName}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch workspace");
    }
  };

  const handleCreate = async (name: string) => {
    if (!user || !user.email) return;
    try {
      await createAccount(user.uid, user.email, name);
      toast.success("New workspace created");
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
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}