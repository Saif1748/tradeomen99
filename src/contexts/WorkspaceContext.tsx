import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  documentId,
  Unsubscribe
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Account, UserProfile } from "@/types/account";
import { 
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

// Create Context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// ✅ FIX 1: Use 'export function' to satisfy Vite HMR
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // State
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to track subscriptions
  const userProfileUnsub = useRef<Unsubscribe | null>(null);
  const accountsUnsub = useRef<Unsubscribe | null>(null);

  // --- 1. Main Auth & Data Listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous listeners
      if (userProfileUnsub.current) userProfileUnsub.current();
      if (accountsUnsub.current) accountsUnsub.current();

      if (!firebaseUser) {
        setActiveAccount(null);
        setAvailableAccounts([]);
        setIsLoading(false);
        return;
      }

      // 1. Listen to User Profile
      const userRef = doc(db, "users", firebaseUser.uid);
      
      userProfileUnsub.current = onSnapshot(userRef, async (docSnap) => {
        // A. Handle New User
        if (!docSnap.exists()) {
          try {
            await provisionDefaultAccount(firebaseUser.uid, firebaseUser.email!);
          } catch (err) {
            console.error("Auto-provisioning failed", err);
            setIsLoading(false);
          }
          return;
        }

        // B. Handle Existing User
        const profile = docSnap.data() as UserProfile;
        
        // Safety Check: If profile exists but has no accounts
        if (!profile.joinedAccountIds || profile.joinedAccountIds.length === 0) {
           await provisionDefaultAccount(firebaseUser.uid, firebaseUser.email!);
           return;
        }

        // 2. Real-time Accounts Listener
        const accountIds = profile.joinedAccountIds.slice(0, 30); 

        // Clear existing listener
        if (accountsUnsub.current) accountsUnsub.current();

        // ✅ FIX 2: Prevent query error if array is empty
        if (accountIds.length === 0) {
          setAvailableAccounts([]);
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, "accounts"), 
          where(documentId(), "in", accountIds)
        );

        accountsUnsub.current = onSnapshot(q, (querySnapshot) => {
          const fetchedAccounts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Account));

          setAvailableAccounts(fetchedAccounts);

          // Determine Active Account
          const targetId = profile.activeAccountId || activeAccount?.id;
          const active = fetchedAccounts.find(a => a.id === targetId) || fetchedAccounts[0];
          
          setActiveAccount(prev => (prev?.id !== active?.id ? active : prev));
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to accounts:", error);
          // ✅ FIX 3: Ensure loading stops even on error (prevents UI freeze)
          setIsLoading(false); 
        });
      });
    });

    return () => {
      unsubscribeAuth();
      if (userProfileUnsub.current) userProfileUnsub.current();
      if (accountsUnsub.current) accountsUnsub.current();
    };
  }, []);

  // --- 2. Action Handlers ---

  const handleSwitch = async (accountId: string) => {
    if (!auth.currentUser) return;
    
    // Optimistic UI Update
    const target = availableAccounts.find(a => a.id === accountId);
    if (target) setActiveAccount(target);

    try {
      await switchUserAccount(auth.currentUser.uid, accountId);
      toast.success(`Switched to ${target?.name}`);
    } catch (error) {
      toast.error("Failed to switch account");
    }
  };

  const handleCreate = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      await createAccount(auth.currentUser.uid, auth.currentUser.email!, name);
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

// ✅ FIX 4: Export hook as a function to satisfy HMR
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}