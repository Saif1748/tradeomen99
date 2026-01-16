import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-Auth";

// ✅ FIX 1: Add 'ai-insights' to the type definition so it matches the UI
export type ReportTab = "overview" | "analysis" | "strategy" | "time" | "ai-insights";

export interface ReportFilters {
  instrument: string;
  strategy: string;
  from?: Date;
  to?: Date;
}

export function useReports(
  tab: ReportTab, 
  filters: ReportFilters = { instrument: "all", strategy: "all" }
) {
  const { user } = useAuth();

  // ✅ FIX 2: Define RPCs for all tabs. 
  // For 'ai-insights', we typically need the 'overview' data to feed the AI, 
  // or a specific 'get_ai_stats' RPC. I'm mapping it to 'get_overview_report' 
  // as a safe default so it doesn't crash.
  const rpcMap: Record<ReportTab, string> = {
    overview: "get_overview_report",
    analysis: "get_trade_analysis",
    strategy: "get_strategy_analysis",
    time: "get_time_analysis",
    "ai-insights": "get_overview_report", // Fallback to overview data for AI context
  };

  return useQuery({
    queryKey: [
      "reports", 
      user?.id, 
      tab, 
      filters?.instrument || "all", 
      filters?.strategy || "all", 
      filters?.from?.toISOString() || "all-time", 
      filters?.to?.toISOString() || "now"
    ],
    queryFn: async () => {
      if (!user?.id) return null;

      const rpcName = rpcMap[tab];
      if (!rpcName) {
        console.warn(`No RPC defined for tab: ${tab}`);
        return null;
      }

      const { data, error } = await supabase.rpc(rpcName, {
        p_user_id: user.id,
        p_instrument: filters?.instrument || "all",
        p_strategy: filters?.strategy || "all",
        p_start_date: filters?.from?.toISOString() || null,
        p_end_date: filters?.to?.toISOString() || null
      });

      if (error) {
        console.error(`[RPC Error] ${rpcName}:`, error.message);
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user?.id,
    
    // ✅ FIX 3: Industry Grade Caching & UX
    staleTime: 1000 * 60 * 5,    
    gcTime: 1000 * 60 * 30,       
    refetchOnWindowFocus: false,  
    retry: 1,
    // Prevents "White Flash" / Loading Spinner when switching tabs
    placeholderData: (previousData) => previousData, 
  });
}