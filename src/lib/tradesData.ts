export interface Trade {
  id: string;
  date: Date;
  symbol: string;
  type: "Crypto" | "Stock" | "Forex" | "Futures" | "Options";
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  target: number;
  quantity: number;
  fees: number;
  pnl: number;
  rMultiple: number;
  strategy: string;
  tags: string[];
  notes: string;
  status: "open" | "closed";
  holdTime: string;
  risk: number;
}

export const strategies = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Scalping",
  "Swing",
  "Momentum",
  "Mean Reversion",
  "Trend Following",
];

export const tradeTypes = ["Crypto", "Stock", "Forex", "Futures", "Options"] as const;

export const defaultTags = [
  "momentum",
  "high-volume",
  "trend-following",
  "support",
  "resistance",
  "divergence",
  "overbought",
  "oversold",
  "range",
  "quick",
];

// Generate mock trades data
export const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [
    {
      id: "1",
      date: new Date(2024, 11, 20),
      symbol: "BTCUSDT",
      type: "Crypto",
      side: "LONG",
      entryPrice: 42500,
      exitPrice: 43200,
      stopLoss: 42000,
      target: 44000,
      quantity: 0.5,
      fees: 15.5,
      pnl: 485.32,
      rMultiple: 2.4,
      strategy: "Breakout",
      tags: ["momentum", "high-volume"],
      notes: "Strong breakout above resistance with high volume confirmation.",
      status: "closed",
      holdTime: "4h 20m",
      risk: 250,
    },
    {
      id: "2",
      date: new Date(2024, 11, 16),
      symbol: "BNBUSDT",
      type: "Crypto",
      side: "LONG",
      entryPrice: 312,
      exitPrice: 325.4,
      stopLoss: 303,
      target: 340,
      quantity: 12,
      fees: 8.2,
      pnl: 156.8,
      rMultiple: 1.5,
      strategy: "Breakout",
      tags: ["momentum"],
      notes: "Clean breakout with volume surge.",
      status: "closed",
      holdTime: "8h 45m",
      risk: 100,
    },
    {
      id: "3",
      date: new Date(2024, 11, 16),
      symbol: "SOLUSDT",
      type: "Crypto",
      side: "LONG",
      entryPrice: 98.5,
      exitPrice: 112.3,
      stopLoss: 94,
      target: 120,
      quantity: 65,
      fees: 12.5,
      pnl: 892.0,
      rMultiple: 3.2,
      strategy: "Pullback",
      tags: ["trend-following", "support"],
      notes: "Pullback to support level with bullish divergence.",
      status: "closed",
      holdTime: "12h 30m",
      risk: 280,
    },
    {
      id: "4",
      date: new Date(2024, 11, 19),
      symbol: "ETHUSDT",
      type: "Crypto",
      side: "SHORT",
      entryPrice: 2280,
      exitPrice: 2320,
      stopLoss: 2330,
      target: 2180,
      quantity: 2,
      fees: 9.5,
      pnl: -125.5,
      rMultiple: -0.8,
      strategy: "Reversal",
      tags: ["resistance", "divergence"],
      notes: "Failed reversal, stopped out.",
      status: "closed",
      holdTime: "2h 15m",
      risk: 150,
    },
    {
      id: "5",
      date: new Date(2024, 11, 15),
      symbol: "BTCUSDT",
      type: "Crypto",
      side: "SHORT",
      entryPrice: 43800,
      exitPrice: 44500,
      stopLoss: 44200,
      target: 42500,
      quantity: 0.8,
      fees: 18.2,
      pnl: -340.2,
      rMultiple: -1.0,
      strategy: "Reversal",
      tags: ["overbought", "resistance"],
      notes: "Stopped out on strong upward momentum.",
      status: "closed",
      holdTime: "1h 45m",
      risk: 320,
    },
    {
      id: "6",
      date: new Date(2024, 11, 20),
      symbol: "AAPL",
      type: "Stock",
      side: "LONG",
      entryPrice: 195.5,
      exitPrice: 195.5,
      stopLoss: 193,
      target: 200,
      quantity: 50,
      fees: 0,
      pnl: 0,
      rMultiple: 0,
      strategy: "Scalping",
      tags: ["range", "quick"],
      notes: "Closed at breakeven.",
      status: "closed",
      holdTime: "45m",
      risk: 125,
    },
    {
      id: "7",
      date: new Date(2024, 11, 18),
      symbol: "XAUUSD",
      type: "Forex",
      side: "LONG",
      entryPrice: 2045,
      exitPrice: 2068,
      stopLoss: 2035,
      target: 2080,
      quantity: 1,
      fees: 5.0,
      pnl: 2300,
      rMultiple: 2.3,
      strategy: "Trend Following",
      tags: ["trend-following", "momentum"],
      notes: "Rode the trend with trailing stop.",
      status: "closed",
      holdTime: "6h 20m",
      risk: 1000,
    },
    {
      id: "8",
      date: new Date(2024, 11, 17),
      symbol: "TSLA",
      type: "Stock",
      side: "SHORT",
      entryPrice: 252,
      exitPrice: 248,
      stopLoss: 256,
      target: 240,
      quantity: 25,
      fees: 2.5,
      pnl: 97.5,
      rMultiple: 1.0,
      strategy: "Reversal",
      tags: ["overbought", "resistance"],
      notes: "Clean rejection at resistance.",
      status: "closed",
      holdTime: "3h 10m",
      risk: 100,
    },
  ];

  return trades;
};

// Calculate stats from trades
export const calculateTradeStats = (trades: Trade[]) => {
  const closedTrades = trades.filter((t) => t.status === "closed");
  const wins = closedTrades.filter((t) => t.pnl > 0);
  const losses = closedTrades.filter((t) => t.pnl < 0);

  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const avgRMultiple =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => sum + t.rMultiple, 0) / closedTrades.length
      : 0;
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const bestTrade = closedTrades.reduce(
    (best, t) => (t.pnl > best.pnl ? t : best),
    closedTrades[0] || { pnl: 0, symbol: "-", date: new Date() }
  );

  return {
    totalTrades: closedTrades.length,
    totalPnl,
    winRate,
    avgRMultiple,
    wins: wins.length,
    losses: losses.length,
    bestTrade,
  };
};
