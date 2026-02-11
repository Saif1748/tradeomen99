import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getAccountsForUser, 
  createAccount, 
  switchUserAccount, 
  getUserProfile
} from "@/services/accountService";
import { Account, UserProfile } from "@/types/account";

// 🔑 Query Keys
export const accountKeys = {
  all: ["accounts"] as const,
  list: (userId: string) => [...accountKeys.all, "list", userId] as const,
  profile: (userId: string) => ["userProfile", userId] as const,
};

export const useAccounts = (userId?: string, userEmail?: string) => {
  const queryClient = useQueryClient();

  // 1. 👤 Fetch User Profile (To track activeAccountId)
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: accountKeys.profile(userId || ""),
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: Infinity, // Profile rarely changes externally in a way that breaks app
  });

  // 2. 🏢 Fetch Available Accounts
  const { 
    data: accounts = [], 
    isLoading: isAccountsLoading 
  } = useQuery({
    queryKey: accountKeys.list(userId || ""),
    queryFn: () => getAccountsForUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 mins cache (Workspaces change rarely)
  });

  // 3. 🟢 Create Account Mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => {
      if (!userId || !userEmail) throw new Error("Missing auth");
      return createAccount(userId, userEmail, name);
    },
    onSuccess: (newAccount) => {
      // Inject into cache
      queryClient.setQueryData(accountKeys.list(userId!), (old: Account[] = []) => {
        return [...old, newAccount];
      });
      
      // Auto-switch to new account logic is handled by the component consuming this, 
      // or we can optimistically update the profile here.
      toast.success(`Workspace "${newAccount.name}" created`);
    },
    onError: () => toast.error("Failed to create workspace"),
  });

  // 4. ⚡ Switch Account Mutation
  const switchMutation = useMutation({
    mutationFn: (accountId: string) => {
      if (!userId) throw new Error("Missing auth");
      return switchUserAccount(userId, accountId);
    },
    // Optimistic Update for Profile
    onMutate: async (newAccountId) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.profile(userId!) });
      const previousProfile = queryClient.getQueryData<UserProfile>(accountKeys.profile(userId!));

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

  // --- Derived State: Active Account ---
  // If profile has active ID, try to find it in the list. Else default to first.
  const activeAccountId = userProfile?.activeAccountId;
  
  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    return accounts.find(a => a.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  return {
    accounts,
    activeAccount,
    isLoading: isProfileLoading || isAccountsLoading,
    createAccount: createMutation.mutateAsync,
    switchAccount: switchMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSwitching: switchMutation.isPending
  };
};
import { useMemo } from "react";