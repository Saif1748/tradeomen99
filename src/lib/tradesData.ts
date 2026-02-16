import { Trade } from "@/types/trade";

// ✅ FIX: Re-export the type to resolve the "locally declared but not exported" error
export type { Trade };

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
 * * IMPORTANT: Returns null for missing/invalid dates to avoid 
 * showing "Current Time" for missing data.
 */
const safeDate = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (typeof val.toMillis === "function") return new Date(val.toMillis());
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * ⏱️ Helper: Format Seconds into "2d 4h", "1h 30m", "45m" or "<1m"
 */
const formatDuration = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return "-";
  const s = Number(seconds);
  if (!isFinite(s) || s < 0) return "-";
  if (s < 60) return "<1m";

  const minutes = Math.floor(s / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

/**
 * 🏗️ UI Helper: Computes derived view model for the Table
 */
export const computeTradeData = (trade: Trade) => {
  const pnl = safeNum(trade.netPnl);
  const avgEntryPrice = safeNum(trade.avgEntryPrice);
  const avgExitPrice = safeNum(trade.avgExitPrice);

  // 📦 Quantity Logic: 
  // Priority: Peak (Actual Max) -> Planned (Risk) -> Legacy Initial -> Current Net
  const totalQuantity =
    Math.abs(safeNum(trade.peakQuantity)) ||
    Math.abs(safeNum(trade.plannedQuantity)) ||
    Math.abs(safeNum(trade.initialQuantity)) ||
    Math.abs(safeNum(trade.netQuantity));

  // Normalize status/direction
  const status = (trade.status || "OPEN").toString().toUpperCase();
  const direction = (trade.direction || "LONG").toString().toUpperCase();
  const rMultiple = safeNum(trade.riskMultiple);

  // Formatting
  const entryDate = safeDate(trade.entryDate);
  const holdTime = formatDuration(safeNum(trade.durationSeconds));

  return {
    id: trade.id,
    symbol: trade.symbol,
    pnl,
    avgEntryPrice,
    avgExitPrice,
    totalQuantity,
    status,
    direction,
    rMultiple,
    // Aliases for component compatibility
    firstExecutionDate: entryDate, 
    entryDate: entryDate,
    instrumentType: trade.assetClass || "STOCK",
    holdTime,
    // Advanced metrics for tooltips or detailed rows
    profitCapture: safeNum(trade.profitCapture),
    returnPercent: safeNum(trade.returnPercent)
  };
};

/**
 * 📊 Analytics Helper: Calculates Dashboard Card Stats
 */
export const calculateTradeStats = (trades: Trade[]) => {
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return {
      totalTrades: 0,
      totalPnl: 0,
      winRate: 0,
      avgRMultiple: 0,
      wins: 0,
      losses: 0,
      bestTrade: { pnl: 0, symbol: "-", date: null },
    };
  }

  const closedTrades = trades.filter(
    (t) => (t.status || "").toString().toUpperCase() === "CLOSED"
  );

  let totalPnl = 0;
  let totalRMultiple = 0;
  let wins = 0;
  let losses = 0;
  let bestTrade: Trade | null = null;

  trades.forEach((trade) => {
    const netPnl = safeNum(trade.netPnl);
    totalPnl += netPnl;

    if ((trade.status || "").toString().toUpperCase() === "CLOSED") {
      const rMultiple = safeNum(trade.riskMultiple);
      totalRMultiple += rMultiple;

      if (netPnl > 0) {
        wins++;
        if (!bestTrade || netPnl > safeNum(bestTrade.netPnl)) {
          bestTrade = trade;
        }
      } else if (netPnl < 0) {
        losses++;
      }
    }
  });

  const winRate =
    closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
  const avgRMultiple =
    closedTrades.length > 0 ? totalRMultiple / closedTrades.length : 0;

  return {
    totalTrades: trades.length,
    totalPnl,
    winRate: Number(winRate.toFixed(2)),
    avgRMultiple: Number(avgRMultiple.toFixed(2)),
    wins,
    losses,
    bestTrade: bestTrade
      ? {
          pnl: safeNum(bestTrade.netPnl),
          symbol: bestTrade.symbol || "Unknown",
          date: safeDate(bestTrade.entryDate),
        }
      : { pnl: 0, symbol: "-", date: null },
  };
};