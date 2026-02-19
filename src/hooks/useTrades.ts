import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getTrades, 
  createTrade, 
  updateTrade, 
  deleteTrade,
  PaginatedTrades
} from "@/services/tradeService";
import { Trade } from "@/types/trade";
import { queryKeys } from "@/lib/queryKeys"; 
import { useState } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";

export const useTrades = (accountId: string | undefined, userId: string | undefined) => {
  const queryClient = useQueryClient();

  // --- Pagination State ---
  const [pageSize, setPageSize] = useState(50);
  const [pageIndex, setPageIndex] = useState(0); // 0-based index
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]); // Stack of cursors

  // --- 1. 🔵 FETCH (Paginated Read) ---
  const queryKey = [...queryKeys.tradesByAccount(accountId || ""), "paginated", pageIndex, pageSize];

  const { 
    data, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey, 
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID required");
      // Use the cursor for the current page
      return getTrades(accountId, pageSize, cursors[pageIndex]);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 mins
    gcTime: 1000 * 60 * 30,   // 30 mins
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep UI stable while fetching next page
  });

  const trades = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const hasNextPage = !!data?.lastDoc && trades.length === pageSize;
  const hasPrevPage = pageIndex > 0;

  // --- Pagination Handlers ---
  const nextPage = () => {
    if (!hasNextPage || !data?.lastDoc) return;
    
    // Push new cursor to stack
    const newCursors = [...cursors];
    newCursors[pageIndex + 1] = data.lastDoc;
    setCursors(newCursors);
    setPageIndex((prev) => prev + 1);
  };

  const prevPage = () => {
    if (!hasPrevPage) return;
    setPageIndex((prev) => prev - 1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(0);
    setCursors([null]); // Reset stack
  };

  // --- 2. 🟢 CREATE (Mutation) ---
  const createMutation = useMutation({
    mutationFn: (newTradeData: any) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return createTrade(accountId, userId, newTradeData);
    },
    onSuccess: () => {
      // Invalidate the FIRST page so the new trade appears immediately
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.tradesByAccount(accountId || ""), "paginated"] 
      });
      
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(accountId!, {}) });
      
      toast.success("Trade logged successfully");
      // Reset to first page to see the new item
      setPageIndex(0);
      setCursors([null]);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create trade");
    },
  });

  // --- 3. 🟡 UPDATE (Optimistic UI) ---
  const updateMutation = useMutation({
    mutationFn: ({ trade, updates }: { trade: Trade; updates: Partial<Trade> }) => {
      if (!accountId || !userId) throw new Error("Missing Context");
      return updateTrade(trade.id, accountId, userId, trade, updates);
    },
    onMutate: async ({ trade, updates }) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousData = queryClient.getQueryData<PaginatedTrades>(queryKey);

      // Optimistic update
      if (previousData) {
        queryClient.setQueryData<PaginatedTrades>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) => 
              t.id === trade.id ? { ...t, ...updates } : t
            )
          };
        });
      }

      return { previousData };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to update trade");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- 4. 🔴 DELETE (Optimistic UI) ---
  const deleteMutation = useMutation({
    mutationFn: (trade: Trade) => {
      if (!userId) throw new Error("Missing User");
      return deleteTrade(trade, userId);
    },
    onMutate: async (tradeToDelete) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<PaginatedTrades>(queryKey);

      if (previousData) {
        queryClient.setQueryData<PaginatedTrades>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((t) => t.id !== tradeToDelete.id),
            totalCount: old.totalCount - 1
          };
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to delete trade");
    },
    onSuccess: () => {
      toast.success("Trade deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.tradesByAccount(accountId || ""), "paginated"] 
      });
    },
  });

  return {
    // Data
    trades,
    totalCount,
    isLoading,
    isError,
    error,
    
    // Pagination Controls
    pageIndex,
    pageSize,
    setPageSize: handlePageSizeChange,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    
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