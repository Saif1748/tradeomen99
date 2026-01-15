import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-Auth";

export interface CalendarDayStats {
  trade_date: string;
  daily_pnl: number;
  trade_count: number;
  win_count: number;
  best_strategy: string | null;
}

export function useCalendar(month: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["calendar-stats", user?.id, month.toISOString()],
    queryFn: async () => {
      if (!user?.id) return new Map<string, CalendarDayStats>();

      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data, error } = await supabase.rpc("get_calendar_stats", {
        p_user_id: user.id,
        p_start_date: startOfMonth.toISOString(),
        p_end_date: endOfMonth.toISOString(),
      });

      if (error) {
        console.error("Calendar Stats Error:", error);
        throw error;
      }

      const statsMap = new Map<string, CalendarDayStats>();
      
      // ✅ FIX: Cast data to any[] to resolve "forEach does not exist"
      if (Array.isArray(data)) {
        (data as any[]).forEach((day) => {
          statsMap.set(day.trade_date, {
            trade_date: day.trade_date,
            daily_pnl: Number(day.daily_pnl) || 0,
            trade_count: Number(day.trade_count) || 0,
            win_count: Number(day.win_count) || 0,
            best_strategy: day.best_strategy || null
          });
        });
      }

      return statsMap;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, 
  });
}