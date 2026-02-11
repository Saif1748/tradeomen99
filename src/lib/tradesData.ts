// src/lib/tradesData.ts
import { Trade } from "@/types/trade";

/**
 * 🛡️ Defensive Helper: Safely parse numbers
 * Prevents NaN crashes if Firestore data is malformed
 */
const safeNum = (val: any): number => {
  const num = parseFloat(val);
  return isFinite(num) ? num : 0;
};

/**
 * 🛡️ Defensive Helper: Safely parse Dates
 * Handles Firestore Timestamp, JS Date, or String
 */
const safeDate = (val: any): Date => {
  if (!val) return new Date();
  // Handle Firestore Timestamp (has toMillis method)
  if (typeof val.toMillis === 'function') return new Date(val.toMillis());
  // Handle standard JS Date
  if (val instanceof Date) return val;
  // Handle string/number
  return new Date(val);
};

export const calculateTradeStats = (trades: Trade[]) => {
  // 1. Fast Exit: Handle empty/null states gracefully
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return {
      totalTrades: 0,
      totalPnl: 0,
      winRate: 0,
      avgRMultiple: 0,
      wins: 0,
      losses: 0,
      bestTrade: { pnl: 0, symbol: "-", date: new Date() },
    };
  }

  // 2. Filter: Only "CLOSED" trades contribute to Win Rate/R-Multiple
  // We use the status field from your Trade type
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  // 3. Accumulators
  let totalPnl = 0;
  let totalRMultiple = 0;
  let wins = 0;
  let losses = 0;
  let bestTrade: Trade | null = null;

  // 4. Iterate (Single Pass for Performance)
  trades.forEach((trade) => {
    const netPnl = safeNum(trade.netPnl);
    
    // Always sum PnL (even for Open trades if marked to market, typically usually just Closed)
    // For this dashboard, usually we sum ALL PnL or just Closed. 
    // Let's sum ALL PnL to match your "Total P&L" card.
    totalPnl += netPnl;

    if (trade.status === "CLOSED") {
      const rMultiple = safeNum(trade.riskMultiple);
      totalRMultiple += rMultiple;

      if (netPnl > 0) {
        wins++;
        // Check for Best Trade
        if (!bestTrade || netPnl > safeNum(bestTrade.netPnl)) {
          bestTrade = trade;
        }
      } else if (netPnl < 0) {
        losses++;
      }
    }
  });

  // 5. Calculate Derived Metrics
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
  const avgRMultiple = closedTrades.length > 0 ? totalRMultiple / closedTrades.length : 0;

  return {
    totalTrades: trades.length, // Count ALL trades (Open + Closed)
    totalPnl,
    winRate,
    avgRMultiple,
    wins,
    losses,
    bestTrade: bestTrade
      ? {
          pnl: safeNum(bestTrade.netPnl),
          symbol: bestTrade.symbol || "Unknown",
          date: safeDate(bestTrade.entryDate),
        }
      : { pnl: 0, symbol: "-", date: new Date() },
  };
};