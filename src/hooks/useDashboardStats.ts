// src/hooks/useDashboardStats.ts
import { useQuery } from "@tanstack/react-query";
import { getTradesInRange, getAggregatedStatsALL } from "@/services/tradeService";
import { 
  calculateMetrics, 
  formatAggregatedMetrics, 
  getPeriodWindows, 
  DateRange, 
  DashboardMetrics, 
  getZeroMetrics 
} from "@/lib/analytics";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMemo } from "react";

export interface DashboardFilters {
  dateRange: DateRange;
  strategyId?: string;
  assetClass?: string;
  tags?: string[];
}

export const useDashboardStats = (filters: DashboardFilters) => {
  const { activeAccount } = useWorkspace();
  const accountId = activeAccount?.id || "";

  // 1. Mode Detection
  // If "ALL", we use server-side aggregation (0 reads).
  // If Time Range, we fetch specific docs (low reads).
  const isAllTime = filters.dateRange === "ALL";

  // 2. Query for "ALL TIME" (Aggregation)
  const { data: aggregatedData, isLoading: isLoadingAgg } = useQuery({
    queryKey: ["dashboard-agg", accountId, filters],
    queryFn: () => getAggregatedStatsALL(accountId, filters),
    enabled: !!accountId && isAllTime,
    staleTime: 1000 * 60 * 10, // 10 mins cache for aggregates
    refetchOnWindowFocus: false,
  });

  // 3. Query for Date Ranges (Fetch Trades)
  const { data: rangedTrades = [], isLoading: isLoadingRange } = useQuery({
    queryKey: ["dashboard-range", accountId, filters],
    queryFn: async () => {
      // Calculate start date based on range (e.g., 30 days ago)
      // Note: We fetch "Period + Previous Period" buffer to calculate % change
      const { prevStart } = getPeriodWindows(filters.dateRange);
      const now = new Date();
      return getTradesInRange(accountId, prevStart, now, filters);
    },
    enabled: !!accountId && !isAllTime,
    staleTime: 1000 * 60 * 5, // 5 mins cache for ranges
    refetchOnWindowFocus: false,
  });

  // 4. Compute Final Metrics (Memoized)
  const stats = useMemo<DashboardMetrics | null>(() => {
    if (!accountId) return null;

    if (isAllTime) {
      // Use Server Aggregated Data (Converted to DashboardMetrics shape)
      return aggregatedData ? formatAggregatedMetrics(aggregatedData) : getZeroMetrics();
    } else {
      // Use Client Calculation on the subset of trades
      return calculateMetrics(rangedTrades, filters.dateRange);
    }
  }, [accountId, isAllTime, aggregatedData, rangedTrades, filters.dateRange]);

  return { 
    stats, 
    isLoading: isAllTime ? isLoadingAgg : isLoadingRange, 
    // Only expose trades if we actually fetched them (for range view).
    // All-time view does not have a list of trades to show here.
    trades: isAllTime ? [] : rangedTrades 
  };
};