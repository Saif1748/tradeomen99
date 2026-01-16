import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-Auth";
import { startOfMonth, endOfMonth } from "date-fns";

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
      if (!user?.id) return {};

      // Calculate range for DB query
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      // Ensure full day coverage
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase.rpc("get_calendar_stats", {
        p_user_id: user.id,
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });

      if (error) {
        console.error("Calendar Stats Error:", error);
        throw error;
      }

      // ✅ FIX: Use a Plain Object (Record) instead of Map
      const statsRecord: Record<string, CalendarDayStats> = {};
      
      if (Array.isArray(data)) {
        (data as any[]).forEach((day) => {
          statsRecord[day.trade_date] = {
            trade_date: day.trade_date,
            daily_pnl: Number(day.daily_pnl) || 0,
            trade_count: Number(day.trade_count) || 0,
            win_count: Number(day.win_count) || 0,
            best_strategy: day.best_strategy || null
          };
        });
      }

      return statsRecord;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Cache for 10 mins (Stable Data)
    placeholderData: (previousData) => previousData, // Prevent flashing on nav
  });
}