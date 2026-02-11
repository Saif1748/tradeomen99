import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { getAccountLedger, recordCashMovement } from "@/services/ledgerService";
import { accountKeys } from "./useAccounts"; // We invalidate account balance from here
import { AccountTransaction, Account } from "@/types/account";

// 🔑 Industry-grade Query Keys
export const ledgerKeys = {
  all: ["ledger"] as const,
  list: (accountId: string) => [...ledgerKeys.all, "list", accountId] as const,
};

export const useLedger = (accountId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  // 1. 📊 Highly Efficient Data Fetching
  const ledgerQuery = useQuery({
    queryKey: ledgerKeys.list(accountId || ""),
    queryFn: () => getAccountLedger(accountId!),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 2, // 2 minutes fresh (SaaS standard for financial history)
    placeholderData: (previousData) => previousData, // Smooth transitions between accounts
    // Financial dashboards usually refetch on focus to ensure no external deposits are missed
    refetchOnWindowFocus: true, 
  });

  // 2. ⚡️ Instant Movement Mutation (Optimistic Update)
  const movementMutation = useMutation({
    mutationFn: (variables: { 
      type: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT"; 
      amount: number; 
      description: string 
    }) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return recordCashMovement(accountId, userId, variables);
    },

    // --- THE MAGIC: OPTIMISTIC UPDATE ---
    onMutate: async (newTx) => {
      // A. Cancel outgoing refetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ledgerKeys.list(accountId!) });
      await queryClient.cancelQueries({ queryKey: accountKeys.list(userId!) }); // Be specific to the list

      // B. Snapshot previous values for rollback
      const previousLedger = queryClient.getQueryData<AccountTransaction[]>(ledgerKeys.list(accountId!));
      const previousAccounts = queryClient.getQueryData<Account[]>(accountKeys.list(userId!));

      // C. Optimistically update Ledger List
      const optimisticEntry: AccountTransaction = {
        id: `temp-${Date.now()}`,
        accountId: accountId!,
        userId: userId!,
        type: newTx.type,
        amount: Math.abs(newTx.amount),
        description: newTx.description,
        date: Timestamp.now(), // Rough estimate for UI
      };

      queryClient.setQueryData(ledgerKeys.list(accountId!), (old: AccountTransaction[] = []) => [
        optimisticEntry,
        ...old,
      ]);

      // D. Optimistically update Account Balance (Global Sync)
      // This ensures the sidebar and header update INSTANTLY
      if (previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), (old: Account[] = []) => 
          old.map(acc => {
            if (acc.id !== accountId) return acc;
            
            let change = Math.abs(newTx.amount);
            if (newTx.type === "WITHDRAWAL") change *= -1;
            // For adjustment, we assume the input amount carries the sign
            if (newTx.type === "ADJUSTMENT") change = newTx.amount; 

            return { ...acc, balance: (acc.balance || 0) + change };
          })
        );
      }

      return { previousLedger, previousAccounts };
    },

    // --- ERROR HANDLING (The "Robust" part) ---
    onError: (err, newTx, context) => {
      // Rollback to snapshots if server fails
      if (context?.previousLedger) {
        queryClient.setQueryData(ledgerKeys.list(accountId!), context.previousLedger);
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(accountKeys.list(userId!), context.previousAccounts);
      }
      
      console.error("Ledger Mutation Error:", err);
      toast.error(`Transaction failed: ${newTx.description}`);
    },

    // --- FINAL SYNC ---
    onSuccess: () => {
      toast.success("Balance updated successfully");
    },
    onSettled: () => {
      // Always refetch in background after result to ensure data integrity
      queryClient.invalidateQueries({ queryKey: ledgerKeys.list(accountId!) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(userId!) });
    },
  });

  return {
    transactions: ledgerQuery.data ?? [],
    isLoading: ledgerQuery.isLoading,
    isProcessing: movementMutation.isPending,
    recordMovement: movementMutation.mutateAsync,
    isRefetching: ledgerQuery.isRefetching, 
  };
};