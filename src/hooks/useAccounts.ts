import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getUserProfile, 
  getUserAccounts, 
  createAccount, 
  switchUserAccount, 
  updateAccountName, 
  deleteAccount 
} from "@/services/accountService";
import { Account, UserProfile } from "@/types/account";

// 🔑 Robust Query Keys for Cache Management
export const accountKeys = {
  all: ["accounts"] as const,
  profile: (userId: string) => [...accountKeys.all, "profile", userId] as const,
  list: (userId: string) => [...accountKeys.all, "list", userId] as const,
};

export const useAccounts = (userId?: string, userEmail?: string) => {
  const queryClient = useQueryClient();

  // 1. 👤 Fetch User Profile (The "Map" to finding accounts)
  const { 
    data: userProfile, 
    isLoading: isProfileLoading 
  } = useQuery({
    queryKey: accountKeys.profile(userId || ""),
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    // Stale time: Keep profile fresh but don't spam. 
    // We rely on mutations to update this locally.
    staleTime: 1000 * 60 * 10, 
  });

  // 2. 🏢 Fetch Actual Account Data
  // FIX: We now pass 'userId' directly. The service handles the robust 'array-contains' query.
  const { 
    data: accounts = [], 
    isLoading: isAccountsLoading 
  } = useQuery({
    queryKey: accountKeys.list(userId || ""),
    queryFn: () => getUserAccounts(userId!), // Changed to pass userId
    // Only run if we have a user. The service handles empty results gracefully.
    enabled: !!userId, 
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    placeholderData: (prev) => prev, // Keep previous data while fetching updates
  });

  // 3. 🟢 Create Account (Optimistic + Cache Injection)
  const createMutation = useMutation({
    mutationFn: (name: string) => {
      if (!userId || !userEmail) throw new Error("Missing auth context");
      return createAccount(userId, userEmail, name);
    },
    onSuccess: (newAccount) => {
      // A. Update Account List Cache
      queryClient.setQueryData(accountKeys.list(userId!), (old: Account[] = []) => {
        return [...old, newAccount];
      });

      // B. Update Profile Cache (Add new ID & Set as Active)
      queryClient.setQueryData(accountKeys.profile(userId!), (old: UserProfile | undefined) => {
        if (!old) return old;
        return {
          ...old,
          joinedAccountIds: [...(old.joinedAccountIds || []), newAccount.id],
          activeAccountId: newAccount.id 
        };
      });

      toast.success(`Workspace "${newAccount.name}" created`);
    },
    onError: () => toast.error("Failed to create workspace"),
    onSettled: () => {
        // Sync with server to ensure timestamps/consistency
        queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId!) });
    }
  });

  // 4. ⚡ Switch Account (Optimistic Profile Update)
  const switchMutation = useMutation({
    mutationFn: (accountId: string) => {
      if (!userId) throw new Error("Missing auth");
      return switchUserAccount(userId, accountId);
    },
    onMutate: async (newAccountId) => {
      // Cancel background refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: accountKeys.profile(userId!) });

      const previousProfile = queryClient.getQueryData<UserProfile>(accountKeys.profile(userId!));

      // Optimistically update active ID
      if (previousProfile) {
        queryClient.setQueryData(accountKeys.profile(userId!), {
          ...previousProfile,
          activeAccountId: newAccountId
        });
      }
      return { previousProfile };
    },
    onError: (_err, _var, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(accountKeys.profile(userId!), context.previousProfile);
      }
      toast.error("Failed to switch workspace");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId!) });
    }
  });

  // 5. ✏️ Rename Account (Optimistic UI)
  const renameMutation = useMutation({
    mutationFn: ({ accountId, name }: { accountId: string; name: string }) => 
      updateAccountName(accountId, name),
    onMutate: async ({ accountId, name }) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.list(userId!) });
      const previousAccounts = queryClient.getQueryData<Account[]>(accountKeys.list(userId!));

      if (previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), previousAccounts.map(acc => 
          acc.id === accountId ? { ...acc, name } : acc
        ));
      }
      return { previousAccounts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), context.previousAccounts);
      }
      toast.error("Failed to rename workspace");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountKeys.list(userId!) })
  });

  // 6. 🗑️ Delete Account (Optimistic Removal)
  const deleteMutation = useMutation({
    mutationFn: (accountId: string) => deleteAccount(accountId),
    onMutate: async (accountId) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.list(userId!) });
      await queryClient.cancelQueries({ queryKey: accountKeys.profile(userId!) });

      const previousAccounts = queryClient.getQueryData<Account[]>(accountKeys.list(userId!));
      const previousProfile = queryClient.getQueryData<UserProfile>(accountKeys.profile(userId!));

      // 1. Remove from List
      if (previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), previousAccounts.filter(a => a.id !== accountId));
      }

      // 2. Remove ID from Profile & Intelligent Active Switch
      if (previousProfile) {
        const newJoined = previousProfile.joinedAccountIds?.filter(id => id !== accountId) || [];
        // If we deleted the active account, switch to the first available one, or null
        const newActive = previousProfile.activeAccountId === accountId 
            ? (newJoined[0] || null) 
            : previousProfile.activeAccountId;

        queryClient.setQueryData(accountKeys.profile(userId!), {
            ...previousProfile,
            joinedAccountIds: newJoined,
            activeAccountId: newActive
        });
      }

      return { previousAccounts, previousProfile };
    },
    onSuccess: () => toast.success("Workspace deleted"),
    onError: (_err, _vars, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), context.previousAccounts);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(accountKeys.profile(userId!), context.previousProfile);
      }
      toast.error("Failed to delete workspace");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list(userId!) });
      queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId!) });
    }
  });

  // --- Derived State (Safe Fallbacks) ---
  const activeAccountId = userProfile?.activeAccountId;
  
  // Logic: 
  // 1. Try to find the account matching the profile's "activeAccountId"
  // 2. If that fails (e.g., just deleted, or data sync issue), default to the first account in the list
  // 3. If list is empty, return null
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || null;

  return {
    // Data
    accounts,
    activeAccount,
    userProfile,
    isLoading: isProfileLoading || isAccountsLoading,

    // Actions
    createAccount: createMutation.mutateAsync,
    switchAccount: switchMutation.mutateAsync,
    renameAccount: renameMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,

    // Loading States
    isCreating: createMutation.isPending,
    isSwitching: switchMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};