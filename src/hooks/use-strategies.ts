import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; 
import { strategiesApi } from "@/services/api/modules/strategies"; 
import { Strategy as ApiStrategy } from "@/services/api/types";
import { useAuth } from "@/hooks/use-Auth";
import { toast } from "sonner";

export interface UIStrategy {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  style: string;
  instrumentTypes: string[];
  rules: Record<string, string[]>;
  trackMissed: boolean;
  createdAt: Date;
  stats: {
    totalTrades: number;
    winRate: number;
    netPL: number;
    profitFactor: number;
    avgWinner: number;
    avgLoser: number;
    expectancy: number;
  };
}

interface StrategyFilters {
  instrument?: string;
  from?: Date;
  to?: Date;
}

export function useStrategies(filters?: StrategyFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();


  // --- 1. Mapper: Database (Snake) -> UI (Camel) ---
  const mapDbToUi = (s: any): UIStrategy => ({
    id: s.id,
    name: s.name,
    description: s.description || "",
    emoji: s.emoji || "♟️",
    color: s.color_hex || "#FFFFFF",
    style: s.style || "General",
    instrumentTypes: s.instrument_types || [],
    rules: s.rules || {},
    trackMissed: s.track_missed_trades || false,
    createdAt: new Date(s.created_at),
    stats: {
      totalTrades: Number(s.stats?.totalTrades || 0),
      winRate: Number(s.stats?.winRate || 0),
      netPL: Number(s.stats?.netPL || 0),
      profitFactor: Number(s.stats?.profitFactor || 0),
      avgWinner: Number(s.stats?.avgWinner || 0),
      avgLoser: Number(s.stats?.avgLoser || 0),
      expectancy: Number(s.stats?.expectancy || 0),
    }
  });


  // --- 2. Mapper: UI (Camel) -> API (Snake) ---
  const mapUiToApi = (s: Partial<UIStrategy>): Partial<ApiStrategy> => {
    const payload: any = { ...s };
    if (s.color) payload.color_hex = s.color;
    if (s.instrumentTypes) payload.instrument_types = s.instrumentTypes;
    if (s.trackMissed !== undefined) payload.track_missed_trades = s.trackMissed;
    
    // Cleanup UI-only fields before sending to FastAPI/Supabase
    delete payload.stats;
    delete payload.createdAt;
    delete payload.color;
    delete payload.instrumentTypes;
    delete payload.trackMissed;
    return payload;
  };


  // --- 3. Main Query: Fetching with Stats & Filters ---
  const query = useQuery({
    queryKey: [
      "strategies", 
      user?.id, 
      filters?.instrument || "all", 
      filters?.from?.toISOString(), 
      filters?.to?.toISOString()
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      // ✅ Calls the updated SQL RPC with the 4 required parameters
      const { data, error } = await supabase.rpc("get_strategies_with_stats", {
        p_user_id: user.id,
        p_instrument: filters?.instrument || "all",
        p_start_date: filters?.from?.toISOString() || null,
        p_end_date: filters?.to?.toISOString() || null
      });

      if (error) {
        console.error("[useStrategies] RPC Error:", error.message);
        throw error;
      }

      return (data as any[]).map(mapDbToUi);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });


  // --- 4. Mutations ---
  const createMutation = useMutation({
    mutationFn: (newStrategy: Partial<UIStrategy>) => 
      strategiesApi.create(mapUiToApi(newStrategy)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy created successfully");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to create strategy"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UIStrategy> }) => 
      strategiesApi.update(id, mapUiToApi(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy updated");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to update strategy"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => strategiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy deleted");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to delete strategy"),
  });


  return {
    strategies: query.data || [],
    // ✅ This helper allows you to easily populate Select components
    strategyNames: (query.data || []).map(s => s.name),
    isLoading: query.isLoading,
    isError: query.isError,
    createStrategy: createMutation.mutate,
    updateStrategy: updateMutation.mutate,
    deleteStrategy: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}


// --- 5. Hook: Fetch Trades for a Specific Strategy ---
export function useStrategyTrades(strategyId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["strategy-trades", strategyId],
    queryFn: async () => {
      if (!user?.id || !strategyId) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("strategy_id", strategyId)
        .order("entry_time", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!strategyId,
  });
}