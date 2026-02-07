import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  Unsubscribe
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Account, UserProfile } from "@/types/account";
import { 
  createAccount, 
  switchUserAccount, 
  provisionDefaultAccount 
} from "@/services/accountService";
import { repairAccountSchema } from "@/services/migrationService"; // ✅ Import Migration Service
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // --- State ---
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Internal state to track user's preferred workspace from their profile
  const [preferredAccountId, setPreferredAccountId] = useState<string | null>(null);

  // Refs to track subscriptions
  const userProfileUnsub = useRef<Unsubscribe | null>(null);
  const accountsUnsub = useRef<Unsubscribe | null>(null);

  // --- 1. Main Auth & Data Listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous listeners on auth change
      if (userProfileUnsub.current) userProfileUnsub.current();
      if (accountsUnsub.current) accountsUnsub.current();

      if (!firebaseUser) {
        setActiveAccount(null);
        setAvailableAccounts([]);
        setPreferredAccountId(null);
        setIsLoading(false);
        return;
      }

      // 🛠️ TRIGGER MIGRATION (Background Process)
      // This runs silently. If the user has old data (missing 'memberIds'),
      // this fixes it. Once fixed, the Firestore listener below (LISTENER B)
      // automatically receives the data update and shows the accounts.
      repairAccountSchema(firebaseUser.uid);

      // ----------------------------------------------------------------
      // LISTENER A: User Profile (Preferences & Auto-Provisioning)
      // ----------------------------------------------------------------
      const userRef = doc(db, "users", firebaseUser.uid);
      
      userProfileUnsub.current = onSnapshot(userRef, async (docSnap) => {
        // Handle Missing Profile (Auto-Provisioning)
        if (!docSnap.exists()) {
          try {
            await provisionDefaultAccount(firebaseUser.uid, firebaseUser.email!);
          } catch (err) {
            console.error("Auto-provisioning failed", err);
          }
          return;
        }

        const profile = docSnap.data() as UserProfile;
        
        // Sync the preference. The 'Effect' below will handle the actual switching.
        if (profile.activeAccountId) {
            setPreferredAccountId(profile.activeAccountId);
        }
      });

      // ----------------------------------------------------------------
      // LISTENER B: Accounts (The Source of Truth)
      // ✅ Robust Query using 'memberIds' array
      // This query never fails due to permissions because it only requests
      // docs where the user is EXPLICITLY listed in the array.
      // ----------------------------------------------------------------
      const q = query(
        collection(db, "accounts"), 
        where("memberIds", "array-contains", firebaseUser.uid)
      );

      accountsUnsub.current = onSnapshot(q, (querySnapshot) => {
        const fetchedAccounts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Account));

        setAvailableAccounts(fetchedAccounts);
        setIsLoading(false); // We have data, safe to render
      }, (error) => {
        console.error("Error listening to accounts:", error);
        // ✅ Self-Healing: Stop loading even on error so UI doesn't freeze
        setIsLoading(false); 
      });
    });

    return () => {
      unsubscribeAuth();
      if (userProfileUnsub.current) userProfileUnsub.current();
      if (accountsUnsub.current) accountsUnsub.current();
    };
  }, []);

  // --- 2. Derived State: Active Account Sync ---
  // This ensures we select the correct account whenever:
  // A) The list of accounts changes (Listener B)
  // B) The user's preference changes (Listener A)
  useEffect(() => {
    if (availableAccounts.length === 0) {
        setActiveAccount(null);
        return;
    }

    // 1. Try to match the user's last active preference
    let target = availableAccounts.find(a => a.id === preferredAccountId);

    // 2. Fallback: If preference is invalid/missing, pick the first available one
    if (!target) {
        target = availableAccounts[0];
    }

    // Only update if actually different to prevent re-renders
    setActiveAccount(prev => (prev?.id !== target.id ? target : prev));
    
  }, [availableAccounts, preferredAccountId]);

  // --- 3. Action Handlers ---

  const handleSwitch = async (accountId: string) => {
    if (!auth.currentUser) return;
    
    // Optimistic UI Update (Instant feedback)
    const target = availableAccounts.find(a => a.id === accountId);
    if (target) {
        setActiveAccount(target);
        setPreferredAccountId(accountId); // Update local state immediately
    }

    try {
      await switchUserAccount(auth.currentUser.uid, accountId);
      toast.success(`Switched to ${target?.name}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch account");
      // Revert is handled automatically by the snapshot listener if write fails
    }
  };

  const handleCreate = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      await createAccount(auth.currentUser.uid, auth.currentUser.email!, name);
      toast.success("New workspace created");
      // The snapshot listeners will automatically pick up the new account 
      // and the activeAccountId change from the backend transaction.
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