import { Trade } from "@/types/trade";
import { 
  startOfMonth, 
  subMonths, 
  startOfYear, 
  subYears, 
  startOfDay,
  endOfDay,
  isValid 
} from "date-fns";

/**
 * 📊 DASHBOARD ANALYTICS ENGINE
 * Industry-grade precision, robust date handling, and safe math.
 */

export interface DashboardMetrics {
  netPnl: number;
  prevPeriodPnl: number;
  periodChangePercent: number;
  
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  
  profitFactor: number; // Capped at 100
  grossProfit: number;
  grossLoss: number;
  
  expectancy: number; // Avg PnL per trade
  expectancyChange: number; // vs previous period
  
  avgWin: number;
  avgLoss: number;
  avgWinLossRatio: number; // Capped at 100
}

export type DateRange = "ALL" | "1M" | "3M" | "6M" | "YTD" | "1Y";

const EPSILON = 0.000001; // Floating point tolerance

// --- 🛠 Helpers ---

// Robust date parser for Firestore/String/Date/Number
const getDate = (date: any): Date => {
  if (!date) return new Date(0); // Epoch fallback
  if (date instanceof Date) return date;
  if (typeof date.toDate === "function") return date.toDate(); // Firestore
  if (typeof date.toMillis === "function") return new Date(date.toMillis());
  return new Date(date);
};

// Calculates the [Start, End] for Current and Previous periods
export const getPeriodWindows = (range: DateRange): { currentStart: Date; prevStart: Date } => {
  const now = new Date();
  let currentStart: Date;
  let prevStart: Date;

  switch (range) {
    case "1M": // Month to Date
      currentStart = startOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      break;
    case "3M": // Rolling 3 Months
      currentStart = subMonths(now, 3);
      prevStart = subMonths(now, 6);
      break;
    case "6M": // Rolling 6 Months
      currentStart = subMonths(now, 6);
      prevStart = subMonths(now, 12);
      break;
    case "YTD": // Year to Date
      currentStart = startOfYear(now);
      prevStart = startOfYear(subYears(now, 1));
      break;
    case "1Y": // Rolling 1 Year
      currentStart = subMonths(now, 12);
      prevStart = subMonths(now, 24);
      break;
    case "ALL":
    default:
      currentStart = new Date(0); // Epoch
      prevStart = new Date(0); // No previous period
      break;
  }

  return { currentStart: startOfDay(currentStart), prevStart: startOfDay(prevStart) };
};

// --- 🧮 1. Client-Side Calculator (For Time-Bounded Fetches) ---

export const calculateMetrics = (trades: Trade[], range: DateRange): DashboardMetrics => {
  if (!trades || !trades.length) return getZeroMetrics();

  const { currentStart, prevStart } = getPeriodWindows(range);
  const now = endOfDay(new Date());

  // 1. Segmentation by Date (Robust Filtering)
  const currentPeriodTrades = trades.filter(t => {
    const d = getDate(t.entryDate);
    return isValid(d) && d >= currentStart && d <= now;
  });

  // Previous period excludes current range to prevent overlap
  const prevPeriodTrades = range === "ALL" ? [] : trades.filter(t => {
    const d = getDate(t.entryDate);
    return isValid(d) && d >= prevStart && d < currentStart;
  });

  // 2. Core Buckets (Using Epsilon for float safety)
  const winners = currentPeriodTrades.filter(t => (t.netPnl || 0) > EPSILON);
  const losers = currentPeriodTrades.filter(t => (t.netPnl || 0) < -EPSILON);
  const breakeven = currentPeriodTrades.filter(t => Math.abs(t.netPnl || 0) <= EPSILON);

  // 3. Financial Aggregates
  const netPnl = currentPeriodTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const grossProfit = winners.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + (t.netPnl || 0), 0));

  // 4. Period Comparison Logic
  const prevNetPnl = prevPeriodTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  
  let periodChangePercent = 0;
  if (range !== "ALL") {
    if (Math.abs(prevNetPnl) > EPSILON) {
      periodChangePercent = ((netPnl - prevNetPnl) / Math.abs(prevNetPnl)) * 100;
    } else if (Math.abs(netPnl) > EPSILON) {
      periodChangePercent = 100; // 0 -> Profit = 100% Growth indicator
    }
  }

  // 5. Expectancy (Avg PnL per Trade)
  const totalCount = currentPeriodTrades.length;
  const expectancy = totalCount > 0 ? netPnl / totalCount : 0;
  
  const prevCount = prevPeriodTrades.length;
  const prevExpectancy = prevCount > 0 ? prevNetPnl / prevCount : 0;
  
  let expectancyChange = 0;
  if (range !== "ALL" && Math.abs(prevExpectancy) > EPSILON) {
    expectancyChange = ((expectancy - prevExpectancy) / Math.abs(prevExpectancy)) * 100;
  }

  // 6. Ratios & Averages
  const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
  const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

  // Safe Profit Factor (Capped at 100 for Industry Grade UI)
  let profitFactor = 0;
  if (grossLoss < EPSILON) {
    profitFactor = grossProfit > 0 ? 100 : 0; 
  } else {
    profitFactor = Math.min(grossProfit / grossLoss, 100);
  }

  // Safe Win/Loss Ratio (Capped at 100)
  let avgWinLossRatio = 0;
  if (avgLoss < EPSILON) {
    avgWinLossRatio = avgWin > 0 ? 100 : 0;
  } else {
    avgWinLossRatio = Math.min(avgWin / avgLoss, 100);
  }

  return {
    netPnl: Number(netPnl.toFixed(2)),
    prevPeriodPnl: Number(prevNetPnl.toFixed(2)),
    periodChangePercent: Number(periodChangePercent.toFixed(2)),
    
    winRate: totalCount > 0 ? Number(((winners.length / totalCount) * 100).toFixed(2)) : 0,
    totalTrades: totalCount,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakEvenTrades: breakeven.length,
    
    profitFactor: Number(profitFactor.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    
    expectancy: Number(expectancy.toFixed(2)),
    expectancyChange: Number(expectancyChange.toFixed(2)),
    
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    avgWinLossRatio: Number(avgWinLossRatio.toFixed(2))
  };
};

// --- 🧮 2. Aggregated Data Formatter (For Server-Side "ALL TIME" Stats) ---

export const formatAggregatedMetrics = (
  data: { 
    grossProfit: number; 
    grossLoss: number; 
    winningTrades: number; 
    losingTrades: number; 
    breakEvenTrades: number 
  }
): DashboardMetrics => {
  const { grossProfit, grossLoss, winningTrades, losingTrades, breakEvenTrades } = data;
  
  const netPnl = grossProfit - grossLoss;
  const totalTrades = winningTrades + losingTrades + breakEvenTrades;
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

  // Safe Ratios
  const profitFactor = grossLoss > 0 ? Math.min(grossProfit / grossLoss, 100) : (grossProfit > 0 ? 100 : 0);
  const avgWinLossRatio = avgLoss > 0 ? Math.min(avgWin / avgLoss, 100) : (avgWin > 0 ? 100 : 0);

  return {
    netPnl: Number(netPnl.toFixed(2)),
    prevPeriodPnl: 0, // Not available in ALL TIME agg view
    periodChangePercent: 0,
    winRate: Number(winRate.toFixed(2)),
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    profitFactor: Number(profitFactor.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    expectancyChange: 0,
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    avgWinLossRatio: Number(avgWinLossRatio.toFixed(2))
  };
};

export const getZeroMetrics = (): DashboardMetrics => ({
  netPnl: 0, prevPeriodPnl: 0, periodChangePercent: 0,
  winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, breakEvenTrades: 0,
  profitFactor: 0, grossProfit: 0, grossLoss: 0,
  expectancy: 0, expectancyChange: 0,
  avgWin: 0, avgLoss: 0, avgWinLossRatio: 0
});