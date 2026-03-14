// src/hooks/useDashboardStats.ts
import { useQuery } from "@tanstack/react-query";
import {
  getTradesInRange,
  getAggregatedStatsALL,
} from "@/services/tradeService";
import {
  calculateMetrics,
  formatAggregatedMetrics,
  getPeriodWindows,
  DateRange,
  DashboardMetrics,
  getZeroMetrics,
} from "@/lib/analytics";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMemo } from "react";
import { Trade } from "@/types/trade";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardFilters {
  dateRange: DateRange;
  strategyId?: string;
  assetClass?: string;
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Central hook for computing dashboard analytics.
 *
 * Strategy:
 * - "ALL" range → server-side Firestore aggregation (zero document reads).
 *   Returns coarse metrics; equity curve not available (no trade list).
 * - Any time range → fetches two periods of trades (current + previous) for
 *   accurate period-over-period comparison. Computes full metrics client-side.
 *
 * React Query caches results so multiple consumers (Dashboard, Charts,
 * Custom Dashboard widgets) share a single network request per key.
 *
 * @param filters - Date range and optional filters (strategy, asset class, tags)
 * @returns       - `{ stats, trades, isLoading }`
 */
export const useDashboardStats = (filters: DashboardFilters) => {
  const { activeAccount } = useWorkspace();
  const accountId = activeAccount?.id ?? "";

  const isAllTime = filters.dateRange === "ALL";

  // ── 1. Query: ALL TIME via server aggregation ────────────────────────────
  const { data: aggregatedData, isLoading: isLoadingAgg } = useQuery({
    queryKey: ["dashboard-agg", accountId, filters],
    queryFn: () => getAggregatedStatsALL(accountId, filters),
    enabled: !!accountId && isAllTime,
    staleTime: 1000 * 60 * 10, // 10 min cache
    refetchOnWindowFocus: false,
  });

  // ── 2. Query: Date Range — fetch both periods for comparison ─────────────
  const { data: rangedTrades = [], isLoading: isLoadingRange } = useQuery<
    Trade[]
  >({
    queryKey: ["dashboard-range", accountId, filters],
    queryFn: async () => {
      // Fetch from prevStart so we have the previous period for % change calc
      const { prevStart } = getPeriodWindows(filters.dateRange);
      return getTradesInRange(accountId, prevStart, new Date(), filters);
    },
    enabled: !!accountId && !isAllTime,
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnWindowFocus: false,
  });

  // ── 3. Compute Final Metrics (memoized) ──────────────────────────────────
  const stats = useMemo<DashboardMetrics>(() => {
    if (!accountId) return getZeroMetrics();

    if (isAllTime) {
      // Server aggregation: extended metrics (streaks, drawdown) are zeroed out
      // since we don't have the trade list. They render as "—" in the widgets.
      return aggregatedData
        ? formatAggregatedMetrics(aggregatedData)
        : getZeroMetrics();
    }

    // Time-range view: full client-side calculation over fetched trades
    return calculateMetrics(rangedTrades, filters.dateRange);
  }, [accountId, isAllTime, aggregatedData, rangedTrades, filters.dateRange]);

  // ── 4. trades: expose raw list for chart components ─────────────────────
  // ALL TIME view does not have a trade list (aggregation only).
  // Range view exposes the current-period trades for equity curve / daily P&L.
  const currentPeriodTrades = useMemo<Trade[]>(() => {
    if (isAllTime || !rangedTrades.length) return [];

    const { currentStart } = getPeriodWindows(filters.dateRange);
    const now = new Date();
    return rangedTrades.filter((t) => {
      const d =
        t.entryDate instanceof Date
          ? t.entryDate
          : (t.entryDate as any).toDate?.() ?? new Date(t.entryDate as any);
      return d >= currentStart && d <= now;
    });
  }, [isAllTime, rangedTrades, filters.dateRange]);

  return {
    stats,
    trades: currentPeriodTrades,
    isLoading: isAllTime ? isLoadingAgg : isLoadingRange,
  };
};