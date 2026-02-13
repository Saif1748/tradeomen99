import { Trade } from "@/types/trade";
import { startOfMonth, subMonths, startOfWeek, subWeeks, startOfYear, isAfter } from "date-fns";

export interface DashboardMetrics {
  netPnl: number;
  prevPeriodPnl: number;
  periodChangePercent: number;
  
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  
  profitFactor: number;
  grossProfit: number;
  grossLoss: number;
  
  expectancy: number; // Avg PnL per trade
  expectancyChange: number; // vs previous period
  
  avgWin: number;
  avgLoss: number;
  avgWinLossRatio: number;
}

export type DateRange = "ALL" | "1M" | "3M" | "YTD" | "1Y";

const getDateThreshold = (range: DateRange): Date => {
  const now = new Date();
  switch (range) {
    case "1M": return startOfMonth(now);
    case "3M": return subMonths(now, 3);
    case "YTD": return startOfYear(now);
    case "1Y": return subMonths(now, 12);
    default: return new Date(0); // Epoch
  }
};

export const calculateMetrics = (trades: Trade[], range: DateRange): DashboardMetrics => {
  if (!trades.length) return getZeroMetrics();

  const now = new Date();
  const threshold = getDateThreshold(range);
  
  // Determine previous period start for comparison (e.g., if 1M, compare to Prev Month)
  let prevThreshold = subMonths(threshold, 1);
  if (range === "3M") prevThreshold = subMonths(threshold, 3);
  if (range === "1Y" || range === "YTD") prevThreshold = subMonths(threshold, 12);

  // 1. Segmentation by Date
  const currentPeriodTrades = trades.filter(t => t.entryDate.toDate() >= threshold);
  const prevPeriodTrades = trades.filter(t => {
    const d = t.entryDate.toDate();
    return d >= prevThreshold && d < threshold;
  });

  // 2. Core Arrays (Current Period)
  const winners = currentPeriodTrades.filter(t => (t.netPnl || 0) > 0);
  const losers = currentPeriodTrades.filter(t => (t.netPnl || 0) < 0);
  const breakeven = currentPeriodTrades.filter(t => (t.netPnl || 0) === 0);

  // 3. Financials
  const netPnl = currentPeriodTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const grossProfit = winners.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + (t.netPnl || 0), 0));
  
  // 4. Period Comparison
  const prevNetPnl = prevPeriodTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  
  let periodChangePercent = 0;
  if (prevNetPnl !== 0) {
    periodChangePercent = ((netPnl - prevNetPnl) / Math.abs(prevNetPnl)) * 100;
  } else if (netPnl !== 0) {
    periodChangePercent = 100; // Growth from zero
  }

  // 5. Expectancy
  const totalCount = currentPeriodTrades.length || 1; // Avoid div by zero
  const expectancy = netPnl / totalCount;
  
  const prevCount = prevPeriodTrades.length || 1;
  const prevExpectancy = prevNetPnl / prevCount;
  
  let expectancyChange = 0;
  if (prevExpectancy !== 0) {
    expectancyChange = ((expectancy - prevExpectancy) / Math.abs(prevExpectancy)) * 100;
  }

  // 6. Averages & Ratios
  const avgWin = winners.length ? grossProfit / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;
  
  return {
    netPnl,
    prevPeriodPnl: prevNetPnl,
    periodChangePercent,
    
    winRate: (winners.length / totalCount) * 100,
    totalTrades: currentPeriodTrades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakEvenTrades: breakeven.length,
    
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss,
    grossProfit,
    grossLoss,
    
    expectancy,
    expectancyChange,
    
    avgWin,
    avgLoss,
    avgWinLossRatio: avgLoss === 0 ? (avgWin > 0 ? 999 : 0) : avgWin / avgLoss
  };
};

const getZeroMetrics = (): DashboardMetrics => ({
  netPnl: 0, prevPeriodPnl: 0, periodChangePercent: 0,
  winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, breakEvenTrades: 0,
  profitFactor: 0, grossProfit: 0, grossLoss: 0,
  expectancy: 0, expectancyChange: 0,
  avgWin: 0, avgLoss: 0, avgWinLossRatio: 0
});