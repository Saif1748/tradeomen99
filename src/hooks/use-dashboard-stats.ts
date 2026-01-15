import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/services/api/types";
import { useAuth } from "@/hooks/use-Auth";
import { DateRange } from "react-day-picker";

export function useDashboardStats(dateRange?: DateRange) {
  const { user } = useAuth();

  return useQuery({
    // 1. queryKey now includes dates to trigger refetching when filters change
    queryKey: ["dashboard-stats", user?.id, dateRange?.from, dateRange?.to],
    
    queryFn: async () => {
      if (!user?.id) return null;

      // 2. Prepare parameters for the RPC call
      // Converting Date objects to ISO strings for PostgreSQL compatibility
      const rpcParams = {
        p_start_date: dateRange?.from?.toISOString().split('T')[0], // YYYY-MM-DD
        p_end_date: dateRange?.to?.toISOString().split('T')[0],     // YYYY-MM-DD
      };

      const { data, error } = await supabase.rpc("get_trading_analytics", rpcParams);

      if (error) {
        console.error("Error fetching trading analytics:", JSON.stringify(error, null, 2));
        
        if (error.code === 'PGRST202') {
             console.warn("Function 'get_trading_analytics' not found or signature mismatch.");
             return null; 
        }
        throw error;
      }

      return data as unknown as DashboardStats;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, 
  });
}