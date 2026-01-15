import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; 
import { tradesApi } from "@/services/api/modules/trades"; 
import { useAuth } from "@/hooks/use-Auth";
import { toast } from "sonner";

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


  const mapDbToUi = (t: any): UITrade => {
    let calculatedR = 0;
    const pnl = Number(t.pnl) || 0;
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


  const query = useQuery({
    // ✅ Industry Grade: Include 'limit' in queryKey so changes trigger a re-fetch
    queryKey: ["trades", user?.id, page, limit],
    queryFn: async () => {
      if (!user?.id) return { data: [], total: 0 };

      // Ensure limit does not exceed 100 for safety
      const safeLimit = Math.min(limit, 100);
      const from = (page - 1) * safeLimit;
      const to = from + safeLimit - 1;

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

      return {
        data: (data || []).map(mapDbToUi),
        total: count || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, 
    // ✅ Smooth UX: Keep previous data while fetching new pages
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });


  const createMutation = useMutation({
    mutationFn: (data: any) => tradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade logged");
    },
  });


  return {
    trades: query.data?.data || [],
    totalTrades: query.data?.total || 0,
    totalPages: Math.ceil((query.data?.total || 0) / limit) || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    createTrade: createMutation.mutate,
    isPlaceholderData: query.isPlaceholderData,
    updateTrade: (args: any) => tradesApi.update(args.id, args.data),
    deleteTrade: (id: string) => tradesApi.delete(id),
  };
}