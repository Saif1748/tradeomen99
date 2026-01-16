import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; 
import { tradesApi } from "@/services/api/modules/trades"; 
import { useAuth } from "@/hooks/use-Auth";
import { toast } from "sonner";

// Define the shape of the data coming from Supabase
interface TradeDBResponse {
  id: string;
  user_id: string;
  symbol: string;
  entry_time: string; // Supabase returns ISO strings
  instrument_type: string;
  direction: string;
  status: string;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  target?: number;
  pnl?: number;
  fees?: number;
  tags: string[];
  strategies?: { name: string } | null; // Joined relation
}

export interface UITrade {
  id: string;
  symbol: string;
  date: Date;            
  type: string;            
  side: string;            
  status: string;
  quantity: number;
  entryPrice: number;    
  exitPrice?: number;    
  stopLoss?: number;     
  target?: number;
  pnl?: number;
  fees: number;
  tags: string[];
  strategy: string;      
  rMultiple: number;
  user_id: string;
}

export function useTrades({ page, limit }: { page: number; limit: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Helpers ---
  const mapDbToUi = (t: TradeDBResponse): UITrade => {
    let calculatedR = 0;
    const pnl = Number(t.pnl) || 0;
    // Simple R-Multiple calc: Risk = |Entry - Stop| * Qty
    const risk = (t.entry_price && t.stop_loss && t.quantity) 
      ? Math.abs((t.entry_price - t.stop_loss) * t.quantity) 
      : 0;

    if (risk > 0) {
      calculatedR = pnl / risk;
    }

    return {
      id: t.id,
      user_id: t.user_id,
      symbol: t.symbol,
      date: new Date(t.entry_time),
      type: t.instrument_type,
      side: t.direction,
      status: t.status,
      quantity: Number(t.quantity) || 0,
      entryPrice: Number(t.entry_price) || 0,
      exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
      stopLoss: t.stop_loss ? Number(t.stop_loss) : undefined,
      target: t.target ? Number(t.target) : undefined,
      pnl: pnl,
      fees: Number(t.fees) || 0,
      tags: t.tags || [],
      strategy: t.strategies?.name || "No Strategy",
      rMultiple: calculatedR,
    };
  };

  // --- Read (Supabase Direct) ---
  const query = useQuery({
    queryKey: ["trades", user?.id, page, limit],
    queryFn: async () => {
      if (!user?.id) return { data: [], total: 0 };

      const safeLimit = Math.min(limit, 100);
      const from = (page - 1) * safeLimit;
      const to = from + safeLimit - 1;

      // Note: Explicitly typing the select string is hard in TS without generated types, 
      // but casting the result works for now.
      const { data, error, count } = await supabase
        .from("trades")
        .select(`
          id, 
          user_id, 
          symbol, 
          direction, 
          status, 
          entry_price, 
          exit_price, 
          quantity, 
          fees, 
          entry_time, 
          tags, 
          pnl, 
          stop_loss, 
          target, 
          instrument_type, 
          strategies!strategy_id(name)
        `, { count: "exact" })
        .eq("user_id", user.id)
        .order("entry_time", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase Error:", error.message);
        throw error;
      }

      // Cast data to our known DB Interface to satisfy TS
      const typedData = data as unknown as TradeDBResponse[];

      return {
        data: typedData.map(mapDbToUi),
        total: count || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, 
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  // --- Cascading Invalidation Helper ---
  // ✅ This ensures that when a trade changes, ALL financial stats update immediately.
  const invalidateFinancials = () => {
    // 1. The Trades list itself
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    
    // 2. The Dashboard (PnL, Win Rate)
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    
    // 3. The Calendar (Daily PnL)
    queryClient.invalidateQueries({ queryKey: ["calendar-stats"] });
    
    // 4. Reports (Analysis charts)
    queryClient.invalidateQueries({ queryKey: ["reports"] });

    // 5. Strategy Stats (Win rates per strategy)
    queryClient.invalidateQueries({ queryKey: ["strategies"] });
  };

  // --- Mutations (FastAPI Backend) ---
   
  const createMutation = useMutation({
    mutationFn: (data: any) => tradesApi.create(data),
    onSuccess: () => {
      invalidateFinancials(); // Trigger the cascade
      toast.success("Trade logged");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create trade"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tradesApi.update(id, data),
    onSuccess: () => {
      invalidateFinancials(); // Trigger the cascade
      toast.success("Trade updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update trade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tradesApi.delete(id),
    onSuccess: () => {
      invalidateFinancials(); // Trigger the cascade
      toast.success("Trade deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete trade"),
  });

  return {
    trades: query.data?.data || [],
    totalTrades: query.data?.total || 0,
    totalPages: Math.ceil((query.data?.total || 0) / limit) || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    
    // Expose Mutate functions
    createTrade: createMutation.mutateAsync,
    updateTrade: updateMutation.mutateAsync,
    deleteTrade: deleteMutation.mutateAsync,
    
    // Status flags
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPlaceholderData: query.isPlaceholderData,
  };
}