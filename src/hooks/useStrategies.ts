import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getStrategies, 
  createStrategy, 
  updateStrategy, 
  deleteStrategy 
} from "@/services/strategyService";
import { Strategy } from "@/types/strategy";

// 🔑 Standardized Query Keys
export const strategyKeys = {
  all: ["strategies"] as const,
  list: (accountId: string) => [...strategyKeys.all, "list", accountId] as const,
  detail: (strategyId: string) => [...strategyKeys.all, "detail", strategyId] as const,
};

export const useStrategies = (accountId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  // 1. 🔵 FETCH (Read with Cache)
  const { 
    data: strategies = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: strategyKeys.list(accountId || ""),
    queryFn: () => {
      if (!accountId) throw new Error("Account ID required");
      return getStrategies(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // ⚡ Data is fresh for 5 mins
    gcTime: 1000 * 60 * 30,   // 🗑️ Keep in memory for 30 mins
    refetchOnWindowFocus: false, 
  });

  // 2. 🟢 CREATE (Cache Injection)
  const createMutation = useMutation({
    mutationFn: (data: Partial<Strategy>) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return createStrategy(accountId, userId, data);
    },
    onSuccess: (newStrategy) => {
      // ⚡ INSTANT: Inject new strategy into cache
      queryClient.setQueryData(strategyKeys.list(accountId!), (old: Strategy[] = []) => {
        return [newStrategy, ...old];
      });
      toast.success("Strategy created successfully");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create strategy");
    },
  });

  // 3. 🟡 UPDATE (Optimistic UI)
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Strategy> }) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return updateStrategy(id, accountId, userId, updates);
    },
    // ⚡ OPTIMISTIC UPDATE START
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: strategyKeys.list(accountId!) });
      
      // Snapshot previous state
      const previousStrategies = queryClient.getQueryData<Strategy[]>(strategyKeys.list(accountId!));

      // Optimistically update
      if (previousStrategies) {
        queryClient.setQueryData(strategyKeys.list(accountId!), (old: Strategy[] = []) => {
          return old.map((s) => (s.id === id ? { ...s, ...updates } : s));
        });
      }

      return { previousStrategies };
    },
    onError: (_err, _variables, context) => {
      // 🔙 Rollback on error
      if (context?.previousStrategies) {
        queryClient.setQueryData(strategyKeys.list(accountId!), context.previousStrategies);
      }
      toast.error("Failed to update strategy");
    },
    onSettled: () => {
      // 🔄 Sync with server
      queryClient.invalidateQueries({ queryKey: strategyKeys.list(accountId!) });
    },
  });

  // 4. 🔴 DELETE (Optimistic UI)
  const deleteMutation = useMutation({
    mutationFn: (strategy: Strategy) => {
      if (!userId) throw new Error("Missing Context");
      return deleteStrategy(strategy, userId);
    },
    onMutate: async (strategy) => {
      await queryClient.cancelQueries({ queryKey: strategyKeys.list(accountId!) });
      const previousStrategies = queryClient.getQueryData<Strategy[]>(strategyKeys.list(accountId!));

      // Optimistically remove
      if (previousStrategies) {
        queryClient.setQueryData(strategyKeys.list(accountId!), (old: Strategy[] = []) => {
          return old.filter((s) => s.id !== strategy.id);
        });
      }

      return { previousStrategies };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStrategies) {
        queryClient.setQueryData(strategyKeys.list(accountId!), context.previousStrategies);
      }
      toast.error("Failed to delete strategy");
    },
    onSuccess: () => {
      toast.success("Strategy deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: strategyKeys.list(accountId!) });
    },
  });

  return {
    // Data
    strategies,
    isLoading,
    isError,
    error,
    refetch,

    // Actions
    createStrategy: createMutation.mutateAsync,
    updateStrategy: updateMutation.mutateAsync,
    deleteStrategy: deleteMutation.mutateAsync,

    // States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};