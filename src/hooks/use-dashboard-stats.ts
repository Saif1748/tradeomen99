import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/services/api/types";
import { useAuth } from "@/hooks/use-Auth";

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      console.log("Fetching dashboard stats for user:", user.id);

      // Explicitly passing 'undefined' for params to indicate no arguments are being sent.
      // If your RPC function expects arguments (even optional ones), this might need to change.
      // But for 'get_dashboard_stats()' which uses auth.uid(), this is correct.
      // We cast to 'any' to bypass strict type checking if the types aren't generated yet.
      const { data, error } = await supabase.rpc("get_dashboard_stats" as any, undefined);

      if (error) {
        console.error("Error fetching dashboard stats:", JSON.stringify(error, null, 2)); // improved logging
        
        // Handle specific error codes if known
        if (error.code === 'PGRST202' || error.message.includes('400')) {
             console.warn("SQL Function Signature Mismatch or Missing Function. Please ensure 'get_dashboard_stats' is created in Supabase with NO parameters.");
             // Return null to avoid crashing the UI, allowing it to render empty/loading states
             return null; 
        }
        throw error;
      }

      // Supabase RPC returns the JSON object directly.
      return data as unknown as DashboardStats;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1, 
  });
}