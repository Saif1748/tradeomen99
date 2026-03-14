// src/lib/analytics.ts
import { Trade } from "@/types/trade";
import {
  startOfMonth,
  subMonths,
  startOfYear,
  subYears,
  startOfDay,
  endOfDay,
  isValid,
} from "date-fns";

/**
 * 📊 DASHBOARD ANALYTICS ENGINE
 * Industry-grade precision, robust date handling, and safe math.
 * Computes a comprehensive set of trading performance metrics from raw trade data.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  // ── Core P&L ──
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  prevPeriodPnl: number;
  periodChangePercent: number;

  // ── Trade Counts ──
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;

  // ── Win Rate & Ratios ──
  winRate: number;          // 0–100
  profitFactor: number;     // Capped at 100 for UI safety
  avgWinLossRatio: number;  // Capped at 100

  // ── Averages ──
  avgWin: number;
  avgLoss: number;
  expectancy: number;          // Net PnL / total trades
  expectancyChange: number;    // vs previous period (%)
  avgReturnPct: number;        // Mean returnPercent across trades

  // ── Risk ──
  avgRR: number;               // Mean riskMultiple across trades with valid R
  maxDrawdown: number;         // Largest single-trade loss (negative number)
  totalFees: number;
  avgRiskPerTrade: number;     // Mean riskAmount across trades with a stop loss

  // ── Execution ──
  totalVolume: number;         // Sum of totalBuyValue (open + closed)
  avgHoldingTimeSeconds: number; // Mean durationSeconds for CLOSED trades

  // ── Streaks ──
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;

  // ── Direction ──
  longTradesCount: number;
  shortTradesCount: number;
  longPnl: number;
  shortPnl: number;

  // ── Highlights ──
  bestTradePnl: number;
  bestTradeSymbol: string;
  worstTradePnl: number;
  worstTradeSymbol: string;
}

export type DateRange = "ALL" | "1M" | "3M" | "6M" | "YTD" | "1Y";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const EPSILON = 0.000001; // Floating-point tolerance

/** Robust date parser for Firestore Timestamp / JS Date / ISO String / Number */
const getDate = (date: unknown): Date => {
  if (!date) return new Date(0);
  if (date instanceof Date) return date;
  if (typeof (date as any).toDate === "function") return (date as any).toDate();
  if (typeof (date as any).toMillis === "function")
    return new Date((date as any).toMillis());
  return new Date(date as string | number);
};

/**
 * Calculates the [currentStart, prevStart] pair for a given date range,
 * enabling accurate period-over-period comparison.
 */
export const getPeriodWindows = (
  range: DateRange
): { currentStart: Date; prevStart: Date } => {
  const now = new Date();
  let currentStart: Date;
  let prevStart: Date;

  switch (range) {
    case "1M":
      currentStart = startOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      break;
    case "3M":
      currentStart = subMonths(now, 3);
      prevStart = subMonths(now, 6);
      break;
    case "6M":
      currentStart = subMonths(now, 6);
      prevStart = subMonths(now, 12);
      break;
    case "YTD":
      currentStart = startOfYear(now);
      prevStart = startOfYear(subYears(now, 1));
      break;
    case "1Y":
      currentStart = subMonths(now, 12);
      prevStart = subMonths(now, 24);
      break;
    case "ALL":
    default:
      currentStart = new Date(0);
      prevStart = new Date(0);
      break;
  }

  return {
    currentStart: startOfDay(currentStart),
    prevStart: startOfDay(prevStart),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Streak Calculation
// ─────────────────────────────────────────────────────────────────────────────

interface StreakResult {
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

/**
 * Scans closed trades sorted by entryDate ascending to compute current
 * and maximum consecutive win/loss streaks.
 */
const calculateStreaks = (closedTrades: Trade[]): StreakResult => {
  const sorted = [...closedTrades].sort((a, b) => {
    return getDate(a.entryDate).getTime() - getDate(b.entryDate).getTime();
  });

  let curWin = 0;
  let curLoss = 0;
  let maxWin = 0;
  let maxLoss = 0;

  for (const trade of sorted) {
    const pnl = trade.netPnl ?? 0;
    if (pnl > EPSILON) {
      curWin++;
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (pnl < -EPSILON) {
      curLoss++;
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    }
    // Break-even trades don't break streaks but don't extend them either
  }

  return {
    currentWinStreak: curWin,
    currentLossStreak: curLoss,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Max Drawdown (running equity peak-to-trough)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the true max drawdown — the largest peak-to-trough decline on
 * the running equity curve built from sorted closed trades.
 * Returns a negative number (e.g. -850.00).
 */
const calculateMaxDrawdown = (closedTrades: Trade[]): number => {
  if (closedTrades.length === 0) return 0;

  const sorted = [...closedTrades].sort(
    (a, b) =>
      getDate(a.entryDate).getTime() - getDate(b.entryDate).getTime()
  );

  let runningPeak = 0;
  let runningEquity = 0;
  let maxDD = 0;

  for (const trade of sorted) {
    runningEquity += trade.netPnl ?? 0;
    if (runningEquity > runningPeak) runningPeak = runningEquity;
    const drawdown = runningEquity - runningPeak;
    if (drawdown < maxDD) maxDD = drawdown;
  }

  return Number(maxDD.toFixed(2));
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Client-Side Calculator — For Time-Bounded Fetches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the full `DashboardMetrics` from an array of trades and a date range.
 * Applies period windowing to isolate current vs. previous period trades.
 *
 * @param trades - All trades fetched for the account (covers the full 2× period window)
 * @param range  - The date range to display metrics for
 * @returns      - A complete `DashboardMetrics` object
 */
export const calculateMetrics = (
  trades: Trade[],
  range: DateRange
): DashboardMetrics => {
  if (!trades?.length) return getZeroMetrics();

  const { currentStart, prevStart } = getPeriodWindows(range);
  const now = endOfDay(new Date());

  // ── 1. Segmentation ──────────────────────────────────────────────────────
  const currentPeriodTrades = trades.filter((t) => {
    const d = getDate(t.entryDate);
    return isValid(d) && d >= currentStart && d <= now;
  });

  const prevPeriodTrades =
    range === "ALL"
      ? []
      : trades.filter((t) => {
          const d = getDate(t.entryDate);
          return isValid(d) && d >= prevStart && d < currentStart;
        });

  // Work only on CLOSED trades for performance metrics,
  // but include OPEN in volume/pnl where applicable
  const closedTrades = currentPeriodTrades.filter(
    (t) => t.status === "CLOSED"
  );

  // ── 2. Core Buckets ───────────────────────────────────────────────────────
  const winners = closedTrades.filter((t) => (t.netPnl ?? 0) > EPSILON);
  const losers = closedTrades.filter((t) => (t.netPnl ?? 0) < -EPSILON);
  const breakeven = closedTrades.filter(
    (t) => Math.abs(t.netPnl ?? 0) <= EPSILON
  );

  // ── 3. Financial Aggregates ───────────────────────────────────────────────
  const netPnl = closedTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossProfit = winners.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const grossLoss = Math.abs(
    losers.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  );
  const totalFees = closedTrades.reduce(
    (s, t) => s + (t.totalFees ?? 0),
    0
  );
  const totalVolume = currentPeriodTrades.reduce(
    (s, t) => s + (t.totalBuyValue ?? 0),
    0
  );

  // ── 4. Period Comparison ──────────────────────────────────────────────────
  const prevClosedTrades = prevPeriodTrades.filter(
    (t) => t.status === "CLOSED"
  );
  const prevNetPnl = prevClosedTrades.reduce(
    (s, t) => s + (t.netPnl ?? 0),
    0
  );

  let periodChangePercent = 0;
  if (range !== "ALL") {
    if (Math.abs(prevNetPnl) > EPSILON) {
      periodChangePercent = ((netPnl - prevNetPnl) / Math.abs(prevNetPnl)) * 100;
    } else if (Math.abs(netPnl) > EPSILON) {
      periodChangePercent = 100;
    }
  }

  // ── 5. Expectancy ─────────────────────────────────────────────────────────
  const totalCount = closedTrades.length;
  const expectancy = totalCount > 0 ? netPnl / totalCount : 0;

  const prevCount = prevClosedTrades.length;
  const prevExpectancy = prevCount > 0 ? prevNetPnl / prevCount : 0;

  let expectancyChange = 0;
  if (range !== "ALL" && Math.abs(prevExpectancy) > EPSILON) {
    expectancyChange =
      ((expectancy - prevExpectancy) / Math.abs(prevExpectancy)) * 100;
  }

  // ── 6. Averages & Ratios ──────────────────────────────────────────────────
  const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
  const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

  // Safe Profit Factor — capped at 100
  let profitFactor = 0;
  if (grossLoss < EPSILON) {
    profitFactor = grossProfit > 0 ? 100 : 0;
  } else {
    profitFactor = Math.min(grossProfit / grossLoss, 100);
  }

  // Safe Win/Loss Ratio — capped at 100
  let avgWinLossRatio = 0;
  if (avgLoss < EPSILON) {
    avgWinLossRatio = avgWin > 0 ? 100 : 0;
  } else {
    avgWinLossRatio = Math.min(avgWin / avgLoss, 100);
  }

  // Avg return % across all closed trades
  const tradesWithReturn = closedTrades.filter(
    (t) => t.returnPercent !== undefined && isFinite(t.returnPercent ?? 0)
  );
  const avgReturnPct =
    tradesWithReturn.length > 0
      ? tradesWithReturn.reduce((s, t) => s + (t.returnPercent ?? 0), 0) /
        tradesWithReturn.length
      : 0;

  // ── 7. Risk Metrics ───────────────────────────────────────────────────────
  const tradesWithRR = closedTrades.filter(
    (t) => t.riskMultiple !== undefined && isFinite(t.riskMultiple ?? 0)
  );
  const avgRR =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce((s, t) => s + (t.riskMultiple ?? 0), 0) /
        tradesWithRR.length
      : 0;

  const tradesWithRisk = closedTrades.filter(
    (t) => (t.riskAmount ?? 0) > 0
  );
  const avgRiskPerTrade =
    tradesWithRisk.length > 0
      ? tradesWithRisk.reduce((s, t) => s + (t.riskAmount ?? 0), 0) /
        tradesWithRisk.length
      : 0;

  const maxDrawdown = calculateMaxDrawdown(closedTrades);

  // ── 8. Holding Time ───────────────────────────────────────────────────────
  const tradesWithDuration = closedTrades.filter(
    (t) => (t.durationSeconds ?? 0) > 0
  );
  const avgHoldingTimeSeconds =
    tradesWithDuration.length > 0
      ? tradesWithDuration.reduce(
          (s, t) => s + (t.durationSeconds ?? 0),
          0
        ) / tradesWithDuration.length
      : 0;

  // ── 9. Streaks ────────────────────────────────────────────────────────────
  const streaks = calculateStreaks(closedTrades);

  // ── 10. Direction Breakdown ───────────────────────────────────────────────
  const longTrades = closedTrades.filter((t) => t.direction === "LONG");
  const shortTrades = closedTrades.filter((t) => t.direction === "SHORT");
  const longPnl = longTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
  const shortPnl = shortTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);

  // ── 11. Best & Worst Trade ────────────────────────────────────────────────
  let bestTradePnl = 0;
  let bestTradeSymbol = "—";
  let worstTradePnl = 0;
  let worstTradeSymbol = "—";

  if (closedTrades.length > 0) {
    const best = closedTrades.reduce((b, t) =>
      (t.netPnl ?? 0) > (b.netPnl ?? 0) ? t : b
    );
    const worst = closedTrades.reduce((w, t) =>
      (t.netPnl ?? 0) < (w.netPnl ?? 0) ? t : w
    );
    bestTradePnl = best.netPnl ?? 0;
    bestTradeSymbol = best.symbol ?? "—";
    worstTradePnl = worst.netPnl ?? 0;
    worstTradeSymbol = worst.symbol ?? "—";
  }

  // ── 12. Assemble & Return ─────────────────────────────────────────────────
  return {
    netPnl: Number(netPnl.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    prevPeriodPnl: Number(prevNetPnl.toFixed(2)),
    periodChangePercent: Number(periodChangePercent.toFixed(2)),

    totalTrades: totalCount,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakEvenTrades: breakeven.length,

    winRate:
      totalCount > 0
        ? Number(((winners.length / totalCount) * 100).toFixed(2))
        : 0,
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWinLossRatio: Number(avgWinLossRatio.toFixed(2)),

    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    expectancyChange: Number(expectancyChange.toFixed(2)),
    avgReturnPct: Number(avgReturnPct.toFixed(2)),

    avgRR: Number(avgRR.toFixed(2)),
    maxDrawdown,
    totalFees: Number(totalFees.toFixed(2)),
    avgRiskPerTrade: Number(avgRiskPerTrade.toFixed(2)),

    totalVolume: Number(totalVolume.toFixed(2)),
    avgHoldingTimeSeconds: Number(avgHoldingTimeSeconds.toFixed(0)),

    ...streaks,

    longTradesCount: longTrades.length,
    shortTradesCount: shortTrades.length,
    longPnl: Number(longPnl.toFixed(2)),
    shortPnl: Number(shortPnl.toFixed(2)),

    bestTradePnl: Number(bestTradePnl.toFixed(2)),
    bestTradeSymbol,
    worstTradePnl: Number(worstTradePnl.toFixed(2)),
    worstTradeSymbol,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Aggregated Data Formatter — For Server-Side "ALL TIME" Stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts the raw aggregation result from `getAggregatedStatsALL` (which
 * only returns coarse counts/sums) into a `DashboardMetrics` object.
 * Extended fields like streaks and drawdown require the full trade array and
 * are zeroed out here — use `calculateMetrics` when you need them.
 */
export const formatAggregatedMetrics = (data: {
  grossProfit: number;
  grossLoss: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
}): DashboardMetrics => {
  const { grossProfit, grossLoss, winningTrades, losingTrades, breakEvenTrades } =
    data;

  const netPnl = grossProfit - grossLoss;
  const totalTrades = winningTrades + losingTrades + breakEvenTrades;

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

  const profitFactor =
    grossLoss > 0
      ? Math.min(grossProfit / grossLoss, 100)
      : grossProfit > 0
      ? 100
      : 0;
  const avgWinLossRatio =
    avgLoss > 0
      ? Math.min(avgWin / avgLoss, 100)
      : avgWin > 0
      ? 100
      : 0;

  return {
    netPnl: Number(netPnl.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    prevPeriodPnl: 0,
    periodChangePercent: 0,

    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,

    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWinLossRatio: Number(avgWinLossRatio.toFixed(2)),

    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    expectancyChange: 0,
    avgReturnPct: 0,

    avgRR: 0,
    maxDrawdown: 0,
    totalFees: 0,
    avgRiskPerTrade: 0,

    totalVolume: 0,
    avgHoldingTimeSeconds: 0,

    currentWinStreak: 0,
    currentLossStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,

    longTradesCount: 0,
    shortTradesCount: 0,
    longPnl: 0,
    shortPnl: 0,

    bestTradePnl: 0,
    bestTradeSymbol: "—",
    worstTradePnl: 0,
    worstTradeSymbol: "—",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Zero Metrics — Loading / Empty State
// ─────────────────────────────────────────────────────────────────────────────

export const getZeroMetrics = (): DashboardMetrics => ({
  netPnl: 0,
  grossProfit: 0,
  grossLoss: 0,
  prevPeriodPnl: 0,
  periodChangePercent: 0,

  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  breakEvenTrades: 0,

  winRate: 0,
  profitFactor: 0,
  avgWinLossRatio: 0,

  avgWin: 0,
  avgLoss: 0,
  expectancy: 0,
  expectancyChange: 0,
  avgReturnPct: 0,

  avgRR: 0,
  maxDrawdown: 0,
  totalFees: 0,
  avgRiskPerTrade: 0,

  totalVolume: 0,
  avgHoldingTimeSeconds: 0,

  currentWinStreak: 0,
  currentLossStreak: 0,
  maxWinStreak: 0,
  maxLossStreak: 0,

  longTradesCount: 0,
  shortTradesCount: 0,
  longPnl: 0,
  shortPnl: 0,

  bestTradePnl: 0,
  bestTradeSymbol: "—",
  worstTradePnl: 0,
  worstTradeSymbol: "—",
});