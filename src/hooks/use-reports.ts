import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-Auth";

export type ReportTab = "overview" | "analysis" | "strategy" | "time";

export interface ReportFilters {
  instrument: string;
  strategy: string;
  from?: Date;
  to?: Date;
}

/**
 * Industry-grade hook for fetching trade reports with SQL-side filtering.
 * Refetches automatically when user, tab, or filters change.
 */
export function useReports(
  tab: ReportTab, 
  filters: ReportFilters = { instrument: "all", strategy: "all" }
) {
  const { user } = useAuth();

  // Mapping tab names to their respective SQL RPC functions
  const rpcMap: Record<ReportTab, string> = {
    overview: "get_overview_report",
    analysis: "get_trade_analysis",
    strategy: "get_strategy_analysis",
    time: "get_time_analysis",
  };

  return useQuery({
    // ✅ Optional chaining on filters ensures the queryKey never crashes
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
      // Return null immediately if no user session exists
      if (!user?.id) return null;

      // Ensure we use the correct parameter names defined in the SQL functions
      const { data, error } = await supabase.rpc(rpcMap[tab], {
        p_user_id: user.id,
        p_instrument: filters?.instrument || "all",
        p_strategy: filters?.strategy || "all",
        p_start_date: filters?.from?.toISOString() || null,
        p_end_date: filters?.to?.toISOString() || null
      });

      if (error) {
        // Detailed error logging for debugging SQL issues
        console.error(`[RPC Error] ${rpcMap[tab]}:`, error.message);
        throw new Error(error.message);
      }

      return data;
    },
    // Only run the query if the user is authenticated
    enabled: !!user?.id,
    
    // Performance Settings
    staleTime: 1000 * 60 * 5,    // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30,       // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,  // Avoid unnecessary refetches on tab switching
    retry: 1,                     // Retry once on failure
  });
}