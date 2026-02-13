import { useQuery } from "@tanstack/react-query";
import { getTrades } from "@/services/tradeService";
import { queryKeys } from "@/lib/queryKeys";
import { calculateMetrics, DateRange } from "@/lib/analytics";
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

  // 1. Fetch ALL trades for the account (Cached)
  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: queryKeys.tradesByAccount(accountId),
    queryFn: () => getTrades(accountId),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // 2. Filter & Calculate (Memoized)
  const stats = useMemo(() => {
    let filtered = [...trades];

    // Filter: Strategy
    if (filters.strategyId) {
      filtered = filtered.filter(t => t.strategyId === filters.strategyId);
    }
    
    // Filter: Asset Class
    if (filters.assetClass) {
      filtered = filtered.filter(t => t.assetClass === filters.assetClass);
    }
    
    // Filter: Tags (Matches ANY)
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(t => 
        t.tags?.some(tag => filters.tags?.includes(tag))
      );
    }

    // Filter: Date Range is handled INSIDE calculateMetrics for comparison logic
    return calculateMetrics(filtered, filters.dateRange);
  }, [trades, filters]);

  return { stats, trades, isLoading, error };
};