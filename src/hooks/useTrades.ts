import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getTrades, 
  createTrade, 
  updateTrade, 
  deleteTrade 
} from "@/services/tradeService";
import { Trade } from "@/types/trade";

// 🔑 Standardized Query Keys for Cache Management
export const tradeKeys = {
  all: ["trades"] as const,
  list: (accountId: string) => [...tradeKeys.all, "list", accountId] as const,
  detail: (tradeId: string) => [...tradeKeys.all, "detail", tradeId] as const,
};

export const useTrades = (accountId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  // 1. 🔵 FETCH (Read with Smart Caching)
  const { 
    data: trades = [], 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: tradeKeys.list(accountId || ""),
    queryFn: () => {
      if (!accountId) throw new Error("Account ID required");
      return getTrades(accountId);
    },
    enabled: !!accountId, // Only run if we have an account
    staleTime: 1000 * 60 * 5, // ⚡ Data is fresh for 5 mins (prevents background refetching)
    gcTime: 1000 * 60 * 30,   // 🗑️ Keep in memory for 30 mins
    refetchOnWindowFocus: false, // Don't refetch just because user clicked the window
    retry: 2, // Retry failed requests twice
  });

  // 2. 🟢 CREATE (Mutation with Cache Injection)
  const createMutation = useMutation({
    mutationFn: (newTradeData: any) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return createTrade(accountId, userId, newTradeData);
    },
    onSuccess: (newTrade) => {
      // ⚡ INSTANT UPDATE: Inject new trade directly into cache
      // This avoids a costly re-fetch of the entire trade list
      queryClient.setQueryData(tradeKeys.list(accountId!), (old: Trade[] = []) => {
        return [newTrade, ...old];
      });
      toast.success("Trade logged successfully");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create trade");
    },
  });

  // 3. 🟡 UPDATE (Optimistic UI)
  const updateMutation = useMutation({
    mutationFn: ({ trade, updates }: { trade: Trade; updates: Partial<Trade> }) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return updateTrade(trade.id, accountId, userId, trade, updates);
    },
    // ⚡ OPTIMISTIC UPDATE START
    onMutate: async ({ trade, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: tradeKeys.list(accountId!) });

      // Snapshot the previous value
      const previousTrades = queryClient.getQueryData<Trade[]>(tradeKeys.list(accountId!));

      // Optimistically update to the new value
      if (previousTrades) {
        queryClient.setQueryData(tradeKeys.list(accountId!), (old: Trade[] = []) => {
          return old.map((t) => 
            t.id === trade.id ? { ...t, ...updates } : t
          );
        });
      }

      // Return a context object with the snapshotted value
      return { previousTrades };
    },
    // ❌ ERROR: Rollback
    onError: (_err, _newTodo, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(tradeKeys.list(accountId!), context.previousTrades);
      }
      toast.error("Failed to update trade");
    },
    // ✅ SETTLED: Sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.list(accountId!) });
    },
  });

  // 4. 🔴 DELETE (Optimistic UI)
  const deleteMutation = useMutation({
    mutationFn: (trade: Trade) => {
      if (!userId) throw new Error("Missing User");
      return deleteTrade(trade, userId);
    },
    onMutate: async (tradeToDelete) => {
      await queryClient.cancelQueries({ queryKey: tradeKeys.list(accountId!) });
      const previousTrades = queryClient.getQueryData<Trade[]>(tradeKeys.list(accountId!));

      // Optimistically remove
      queryClient.setQueryData(tradeKeys.list(accountId!), (old: Trade[] = []) => {
        return old.filter((t) => t.id !== tradeToDelete.id);
      });

      return { previousTrades };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(tradeKeys.list(accountId!), context.previousTrades);
      }
      toast.error("Failed to delete trade");
    },
    onSuccess: () => {
      toast.success("Trade deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.list(accountId!) });
    },
  });

  return {
    // Data
    trades,
    isLoading,
    isError,
    error,
    
    // Actions
    createTrade: createMutation.mutateAsync,
    updateTrade: updateMutation.mutateAsync,
    deleteTrade: deleteMutation.mutateAsync,
    
    // States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};