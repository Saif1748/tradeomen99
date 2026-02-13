// Types for the Calendar Module

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  pnl: number;
  entryTime?: string;
  exitTime?: string;
  strategy: string;
}

export interface DayData {
  date: Date;
  trades: Trade[];
  totalPnL: number;
  winRate: number;
  tradeCount: number;
  emotion: 'positive' | 'neutral' | 'negative';
  bestStrategy: string;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  note?: string;
}

// Helper to calculate monthly stats from the generated map
export function getMonthStats(data: Map<string, DayData>) {
  const days = Array.from(data.values());
  
  if (days.length === 0) {
    return {
      monthlyPnL: 0,
      winRate: 0,
      totalTrades: 0,
      tradingDays: 0,
    };
  }

  const monthlyPnL = days.reduce((sum, d) => sum + d.totalPnL, 0);
  const totalTrades = days.reduce((sum, d) => sum + d.tradeCount, 0);
  const totalWins = days.reduce((sum, d) => sum + (d.trades.filter(t => t.pnl > 0).length), 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  return {
    monthlyPnL: Math.round(monthlyPnL * 100) / 100,
    winRate: Math.round(winRate),
    totalTrades,
    tradingDays: days.length,
  };
}