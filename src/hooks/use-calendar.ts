import { useQuery } from "@tanstack/react-query";
import { tradesApi } from "@/services/api/modules/trades";
import { startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import { DayData } from "@/lib/calendarData";
import { useMemo } from "react";

export function useCalendar(currentDate: Date, notes: Map<string, string>) {
  // 1. Calculate fetch range (include buffer days for grid)
  const dateRange = useMemo(() => {
    const start = subDays(startOfMonth(currentDate), 7);
    const end = addDays(endOfMonth(currentDate), 7);
    return { start, end };
  }, [currentDate]);

  // 2. Query Hook
  const { data: rawTrades, isLoading } = useQuery({
    queryKey: ["trades", "calendar", dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      // Fetch up to 500 trades to ensure we cover the whole month view
      const response = await tradesApi.getAll(1, 500, {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // 3. Transformation Logic
  const monthData = useMemo(() => {
    const data = new Map<string, DayData>();
    if (!rawTrades) return data;

    rawTrades.forEach((apiTrade) => {
      // Normalize Date
      const tradeDate = new Date(apiTrade.entry_time);
      const dateKey = tradeDate.toDateString();

      // Initialize Day if missing
      if (!data.has(dateKey)) {
        data.set(dateKey, {
          date: tradeDate,
          trades: [],
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0,
          emotion: 'neutral',
          bestStrategy: 'N/A',
          bestTrade: null,
          worstTrade: null
        });
      }

      const day = data.get(dateKey)!;
      const pnl = apiTrade.pnl || 0;

      // Map API Trade to Calendar Trade
      day.trades.push({
        id: apiTrade.id,
        symbol: apiTrade.symbol,
        direction: (apiTrade.direction?.toLowerCase() || 'long') as 'long' | 'short',
        pnl: pnl,
        entryTime: tradeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitTime: apiTrade.exit_time ? new Date(apiTrade.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        strategy: apiTrade.strategies?.name || "No Strategy"
      });

      // Accumulate Stats
      day.totalPnL += pnl;
      day.tradeCount += 1;
    });

    // Finalize Day Stats
    data.forEach((day, key) => {
      const wins = day.trades.filter(t => t.pnl > 0).length;
      day.winRate = day.tradeCount > 0 ? Math.round((wins / day.tradeCount) * 100) : 0;
      day.totalPnL = Math.round(day.totalPnL * 100) / 100;

      // Best Strategy Calculation
      const strategyCounts: Record<string, number> = {};
      day.trades.filter(t => t.pnl > 0).forEach(t => {
        strategyCounts[t.strategy] = (strategyCounts[t.strategy] || 0) + 1;
      });
      day.bestStrategy = Object.keys(strategyCounts).sort((a,b) => strategyCounts[b] - strategyCounts[a])[0] || 'N/A';

      // Attach User Notes
      const note = notes.get(key);
      if (note) day.note = note;
    });

    return data;
  }, [rawTrades, notes]);

  return {
    monthData,
    isLoading
  };
}