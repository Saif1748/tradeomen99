// Execution represents a single buy/sell action within a trade
export interface Execution {
  id: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  datetime: Date;
  fee: number;
}

// Trade with multiple executions
export interface Trade {
  id: string;
  symbol: string;
  instrumentType: "Crypto" | "Stock" | "Forex" | "Futures" | "Options";
  stopLoss: number;
  target: number;
  strategy: string;
  tags: string[];
  notes: string;
  screenshots: string[];
  executions: Execution[];
  createdAt: Date;
  updatedAt: Date;
}

// Computed trade properties (derived from executions)
export interface ComputedTradeData {
  status: "open" | "closed";
  direction: "LONG" | "SHORT";
  avgEntryPrice: number;
  avgExitPrice: number;
  totalQuantity: number;
  remainingQuantity: number;
  totalFees: number;
  pnl: number;
  rMultiple: number;
  risk: number;
  holdTime: string;
  firstExecutionDate: Date;
  lastExecutionDate: Date;
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

export const instrumentTypes = ["Crypto", "Stock", "Forex", "Futures", "Options"] as const;

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

// Helper function to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Compute trade data from executions
export const computeTradeData = (trade: Trade): ComputedTradeData => {
  const { executions, stopLoss } = trade;
  
  if (executions.length === 0) {
    return {
      status: "open",
      direction: "LONG",
      avgEntryPrice: 0,
      avgExitPrice: 0,
      totalQuantity: 0,
      remainingQuantity: 0,
      totalFees: 0,
      pnl: 0,
      rMultiple: 0,
      risk: 0,
      holdTime: "-",
      firstExecutionDate: new Date(),
      lastExecutionDate: new Date(),
    };
  }

  // Sort executions by datetime
  const sortedExecutions = [...executions].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  // Determine direction from first execution
  const direction = sortedExecutions[0].side === "BUY" ? "LONG" : "SHORT";

  // Calculate buy and sell totals
  let buyQty = 0;
  let buyValue = 0;
  let sellQty = 0;
  let sellValue = 0;
  let totalFees = 0;

  executions.forEach((exec) => {
    totalFees += exec.fee;
    if (exec.side === "BUY") {
      buyQty += exec.quantity;
      buyValue += exec.price * exec.quantity;
    } else {
      sellQty += exec.quantity;
      sellValue += exec.price * exec.quantity;
    }
  });

  const avgBuyPrice = buyQty > 0 ? buyValue / buyQty : 0;
  const avgSellPrice = sellQty > 0 ? sellValue / sellQty : 0;

  // For LONG: entry = buy, exit = sell
  // For SHORT: entry = sell, exit = buy
  const avgEntryPrice = direction === "LONG" ? avgBuyPrice : avgSellPrice;
  const avgExitPrice = direction === "LONG" ? avgSellPrice : avgBuyPrice;
  
  const entryQty = direction === "LONG" ? buyQty : sellQty;
  const exitQty = direction === "LONG" ? sellQty : buyQty;
  
  const remainingQuantity = Math.abs(entryQty - exitQty);
  const status = remainingQuantity < 0.0001 ? "closed" : "open";

  // Calculate P&L
  let pnl = 0;
  if (status === "closed") {
    const closedQty = Math.min(entryQty, exitQty);
    if (direction === "LONG") {
      pnl = (avgSellPrice - avgBuyPrice) * closedQty - totalFees;
    } else {
      pnl = (avgSellPrice - avgBuyPrice) * closedQty - totalFees;
    }
  }

  // Calculate risk and R-multiple
  const risk = stopLoss > 0 ? Math.abs(avgEntryPrice - stopLoss) * entryQty : 0;
  const rMultiple = risk > 0 ? pnl / risk : 0;

  // Calculate hold time
  const firstDate = sortedExecutions[0].datetime;
  const lastDate = sortedExecutions[sortedExecutions.length - 1].datetime;
  const diffMs = new Date(lastDate).getTime() - new Date(firstDate).getTime();
  
  let holdTime = "-";
  if (status === "closed" && diffMs > 0) {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      holdTime = `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      holdTime = `${diffHours}h ${diffMins}m`;
    } else {
      holdTime = `${diffMins}m`;
    }
  }

  return {
    status,
    direction,
    avgEntryPrice,
    avgExitPrice,
    totalQuantity: entryQty,
    remainingQuantity,
    totalFees,
    pnl,
    rMultiple,
    risk,
    holdTime,
    firstExecutionDate: new Date(firstDate),
    lastExecutionDate: new Date(lastDate),
  };
};

// Generate mock trades with executions
export const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [
    {
      id: "1",
      symbol: "BTCUSDT",
      instrumentType: "Crypto",
      stopLoss: 42000,
      target: 44000,
      strategy: "Breakout",
      tags: ["momentum", "high-volume"],
      notes: "Strong breakout above resistance with high volume confirmation.",
      screenshots: [],
      executions: [
        { id: "1-1", side: "BUY", price: 42500, quantity: 0.5, datetime: new Date(2024, 11, 20, 9, 30), fee: 7.5 },
        { id: "1-2", side: "SELL", price: 43200, quantity: 0.5, datetime: new Date(2024, 11, 20, 13, 50), fee: 8.0 },
      ],
      createdAt: new Date(2024, 11, 20),
      updatedAt: new Date(2024, 11, 20),
    },
    {
      id: "2",
      symbol: "BNBUSDT",
      instrumentType: "Crypto",
      stopLoss: 303,
      target: 340,
      strategy: "Breakout",
      tags: ["momentum"],
      notes: "Clean breakout with volume surge.",
      screenshots: [],
      executions: [
        { id: "2-1", side: "BUY", price: 312, quantity: 12, datetime: new Date(2024, 11, 16, 10, 0), fee: 4.1 },
        { id: "2-2", side: "SELL", price: 325.4, quantity: 12, datetime: new Date(2024, 11, 16, 18, 45), fee: 4.1 },
      ],
      createdAt: new Date(2024, 11, 16),
      updatedAt: new Date(2024, 11, 16),
    },
    {
      id: "3",
      symbol: "SOLUSDT",
      instrumentType: "Crypto",
      stopLoss: 94,
      target: 120,
      strategy: "Pullback",
      tags: ["trend-following", "support"],
      notes: "Pullback to support level with bullish divergence. Scaled in on dips.",
      screenshots: [],
      executions: [
        { id: "3-1", side: "BUY", price: 98.5, quantity: 30, datetime: new Date(2024, 11, 16, 8, 0), fee: 3.0 },
        { id: "3-2", side: "BUY", price: 96.2, quantity: 35, datetime: new Date(2024, 11, 16, 10, 15), fee: 3.5 },
        { id: "3-3", side: "SELL", price: 112.3, quantity: 65, datetime: new Date(2024, 11, 16, 20, 30), fee: 6.0 },
      ],
      createdAt: new Date(2024, 11, 16),
      updatedAt: new Date(2024, 11, 16),
    },
    {
      id: "4",
      symbol: "ETHUSDT",
      instrumentType: "Crypto",
      stopLoss: 2330,
      target: 2180,
      strategy: "Reversal",
      tags: ["resistance", "divergence"],
      notes: "Failed reversal, stopped out.",
      screenshots: [],
      executions: [
        { id: "4-1", side: "SELL", price: 2280, quantity: 2, datetime: new Date(2024, 11, 19, 14, 0), fee: 4.75 },
        { id: "4-2", side: "BUY", price: 2320, quantity: 2, datetime: new Date(2024, 11, 19, 16, 15), fee: 4.75 },
      ],
      createdAt: new Date(2024, 11, 19),
      updatedAt: new Date(2024, 11, 19),
    },
    {
      id: "5",
      symbol: "BTCUSDT",
      instrumentType: "Crypto",
      stopLoss: 44200,
      target: 42500,
      strategy: "Reversal",
      tags: ["overbought", "resistance"],
      notes: "Stopped out on strong upward momentum.",
      screenshots: [],
      executions: [
        { id: "5-1", side: "SELL", price: 43800, quantity: 0.8, datetime: new Date(2024, 11, 15, 11, 0), fee: 9.1 },
        { id: "5-2", side: "BUY", price: 44500, quantity: 0.8, datetime: new Date(2024, 11, 15, 12, 45), fee: 9.1 },
      ],
      createdAt: new Date(2024, 11, 15),
      updatedAt: new Date(2024, 11, 15),
    },
    {
      id: "6",
      symbol: "AAPL",
      instrumentType: "Stock",
      stopLoss: 193,
      target: 200,
      strategy: "Scalping",
      tags: ["range", "quick"],
      notes: "Closed at breakeven.",
      screenshots: [],
      executions: [
        { id: "6-1", side: "BUY", price: 195.5, quantity: 50, datetime: new Date(2024, 11, 20, 9, 35), fee: 0 },
        { id: "6-2", side: "SELL", price: 195.5, quantity: 50, datetime: new Date(2024, 11, 20, 10, 20), fee: 0 },
      ],
      createdAt: new Date(2024, 11, 20),
      updatedAt: new Date(2024, 11, 20),
    },
    {
      id: "7",
      symbol: "XAUUSD",
      instrumentType: "Forex",
      stopLoss: 2035,
      target: 2080,
      strategy: "Trend Following",
      tags: ["trend-following", "momentum"],
      notes: "Rode the trend with trailing stop.",
      screenshots: [],
      executions: [
        { id: "7-1", side: "BUY", price: 2045, quantity: 1, datetime: new Date(2024, 11, 18, 8, 0), fee: 2.5 },
        { id: "7-2", side: "SELL", price: 2068, quantity: 1, datetime: new Date(2024, 11, 18, 14, 20), fee: 2.5 },
      ],
      createdAt: new Date(2024, 11, 18),
      updatedAt: new Date(2024, 11, 18),
    },
    {
      id: "8",
      symbol: "TSLA",
      instrumentType: "Stock",
      stopLoss: 256,
      target: 240,
      strategy: "Reversal",
      tags: ["overbought", "resistance"],
      notes: "Clean rejection at resistance.",
      screenshots: [],
      executions: [
        { id: "8-1", side: "SELL", price: 252, quantity: 25, datetime: new Date(2024, 11, 17, 10, 0), fee: 1.25 },
        { id: "8-2", side: "BUY", price: 248, quantity: 25, datetime: new Date(2024, 11, 17, 13, 10), fee: 1.25 },
      ],
      createdAt: new Date(2024, 11, 17),
      updatedAt: new Date(2024, 11, 17),
    },
    {
      id: "9",
      symbol: "NVDA",
      instrumentType: "Stock",
      stopLoss: 480,
      target: 520,
      strategy: "Momentum",
      tags: ["momentum", "high-volume"],
      notes: "Strong momentum play, scaled out in parts.",
      screenshots: [],
      executions: [
        { id: "9-1", side: "BUY", price: 490, quantity: 20, datetime: new Date(2024, 11, 21, 9, 35), fee: 1.0 },
      ],
      createdAt: new Date(2024, 11, 21),
      updatedAt: new Date(2024, 11, 21),
    },
  ];

  return trades;
};

// Calculate stats from trades
export const calculateTradeStats = (trades: Trade[]) => {
  const tradesWithData = trades.map((t) => ({ trade: t, computed: computeTradeData(t) }));
  const closedTrades = tradesWithData.filter((t) => t.computed.status === "closed");
  const wins = closedTrades.filter((t) => t.computed.pnl > 0);
  const losses = closedTrades.filter((t) => t.computed.pnl < 0);

  const totalPnl = closedTrades.reduce((sum, t) => sum + t.computed.pnl, 0);
  const avgRMultiple =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => sum + t.computed.rMultiple, 0) / closedTrades.length
      : 0;
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const bestTrade = closedTrades.reduce(
    (best, t) => (t.computed.pnl > (best?.computed.pnl || 0) ? t : best),
    closedTrades[0]
  );

  return {
    totalTrades: closedTrades.length,
    totalPnl,
    winRate,
    avgRMultiple,
    wins: wins.length,
    losses: losses.length,
    bestTrade: bestTrade
      ? {
          pnl: bestTrade.computed.pnl,
          symbol: bestTrade.trade.symbol,
          date: bestTrade.computed.firstExecutionDate,
        }
      : { pnl: 0, symbol: "-", date: new Date() },
  };
};

// Legacy type mapping for backward compatibility
export const tradeTypes = instrumentTypes;
