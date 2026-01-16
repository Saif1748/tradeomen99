import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/services/api/types";
import { useAuth } from "@/hooks/use-Auth";
import { DateRange } from "react-day-picker";

export function useDashboardStats(dateRange?: DateRange) {
  const { user } = useAuth();

  return useQuery({
    // 1. Unique key including dependencies
    queryKey: ["dashboard-stats", user?.id, dateRange?.from, dateRange?.to],
    
    queryFn: async () => {
      if (!user?.id) return null;

      // 2. Robust Parameter Handling
      // Explicitly defaults to null to prevent 'undefined' issues with RPC calls
      const rpcParams = {
        p_start_date: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : null,
        p_end_date: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : null,
      };

      const { data, error } = await supabase.rpc("get_trading_analytics", rpcParams);

      if (error) {
        console.error("Error fetching trading analytics:", JSON.stringify(error, null, 2));
        
        // Graceful handling for missing RPC function in early dev
        if (error.code === 'PGRST202') {
             console.warn("Function 'get_trading_analytics' not found or signature mismatch.");
             return null; 
        }
        throw error;
      }

      return data as unknown as DashboardStats;
    },
    enabled: !!user?.id,
    
    // 3. Industry Grade Caching Strategy
    staleTime: 1000 * 60 * 5, // 5 minutes (Data remains fresh unless invalidated by use-trades)
    retry: 1,
    
    // 4. Critical UX Fix: Prevents layout shift/flashing when changing dates
    placeholderData: (previousData) => previousData,
  });
}