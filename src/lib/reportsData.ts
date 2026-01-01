import { Trade, generateMockTrades } from "./tradesData";
import { Strategy, generateMockStrategies } from "./strategiesData";

// Types for Reports data
export interface EquityCurvePoint {
  date: string;
  value: number;
  drawdown: number;
}

export interface WinLossData {
  name: string;
  value: number;
  fill: string;
}

export interface PnLDistribution {
  range: string;
  count: number;
}

export interface HoldingTimeData {
  range: string;
  count: number;
  avgPnl: number;
}

export interface ScatterPoint {
  rMultiple: number;
  pnl: number;
  holdTime: number;
  symbol: string;
  isWin: boolean;
}

export interface DayPerformance {
  day: string;
  trades: number;
  winRate: number;
  pnl: number;
}

export interface HourPerformance {
  hour: string;
  trades: number;
  pnl: number;
  winRate: number;
}

export interface SessionPerformance {
  session: string;
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export interface StrategyPerformance {
  name: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  avgPnl: number;
  totalPnl: number;
  maxDrawdown: number;
}

export interface AIInsight {
  type: "positive" | "negative" | "neutral";
  message: string;
}

// Generate equity curve data
export const generateEquityCurve = (trades: Trade[]): EquityCurvePoint[] => {
  const sortedTrades = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());
  let cumulative = 0;
  let peak = 0;
  
  return sortedTrades.map(trade => {
    cumulative += trade.pnl;
    peak = Math.max(peak, cumulative);
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    
    return {
      date: trade.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: cumulative,
      drawdown: -drawdown
    };
  });
};

// Generate win/loss distribution
export const generateWinLossData = (trades: Trade[]): WinLossData[] => {
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const breakeven = trades.filter(t => t.pnl === 0).length;
  
  return [
    { name: "Wins", value: wins, fill: "hsl(160 60% 45%)" },
    { name: "Losses", value: losses, fill: "hsl(0 70% 50%)" },
    { name: "Breakeven", value: breakeven, fill: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);
};

// Generate long vs short performance
export const generateLongShortData = (trades: Trade[]) => {
  const longTrades = trades.filter(t => t.side === "LONG");
  const shortTrades = trades.filter(t => t.side === "SHORT");
  
  const longPnl = longTrades.reduce((sum, t) => sum + t.pnl, 0);
  const shortPnl = shortTrades.reduce((sum, t) => sum + t.pnl, 0);
  const longWinRate = longTrades.length > 0 
    ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length) * 100 
    : 0;
  const shortWinRate = shortTrades.length > 0 
    ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length) * 100 
    : 0;
  
  return [
    { side: "Long", trades: longTrades.length, pnl: longPnl, winRate: longWinRate },
    { side: "Short", trades: shortTrades.length, pnl: shortPnl, winRate: shortWinRate },
  ];
};

// Generate PnL distribution histogram
export const generatePnLDistribution = (trades: Trade[]): PnLDistribution[] => {
  const ranges = [
    { min: -Infinity, max: -500, label: "< -$500" },
    { min: -500, max: -200, label: "-$500 to -$200" },
    { min: -200, max: 0, label: "-$200 to $0" },
    { min: 0, max: 200, label: "$0 to $200" },
    { min: 200, max: 500, label: "$200 to $500" },
    { min: 500, max: 1000, label: "$500 to $1K" },
    { min: 1000, max: Infinity, label: "> $1K" },
  ];
  
  return ranges.map(range => ({
    range: range.label,
    count: trades.filter(t => t.pnl > range.min && t.pnl <= range.max).length
  }));
};

// Generate holding time distribution
export const generateHoldingTimeData = (trades: Trade[]): HoldingTimeData[] => {
  const parseHoldTime = (holdTime: string): number => {
    const hours = holdTime.match(/(\d+)h/);
    const minutes = holdTime.match(/(\d+)m/);
    return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
  };
  
  const ranges = [
    { min: 0, max: 60, label: "< 1 hour" },
    { min: 60, max: 240, label: "1-4 hours" },
    { min: 240, max: 480, label: "4-8 hours" },
    { min: 480, max: 1440, label: "8-24 hours" },
    { min: 1440, max: Infinity, label: "> 1 day" },
  ];
  
  return ranges.map(range => {
    const tradesInRange = trades.filter(t => {
      const minutes = parseHoldTime(t.holdTime);
      return minutes >= range.min && minutes < range.max;
    });
    
    const avgPnl = tradesInRange.length > 0 
      ? tradesInRange.reduce((sum, t) => sum + t.pnl, 0) / tradesInRange.length 
      : 0;
    
    return {
      range: range.label,
      count: tradesInRange.length,
      avgPnl
    };
  });
};

// Generate scatter plot data
export const generateScatterData = (trades: Trade[]): ScatterPoint[] => {
  const parseHoldTime = (holdTime: string): number => {
    const hours = holdTime.match(/(\d+)h/);
    const minutes = holdTime.match(/(\d+)m/);
    return (hours ? parseInt(hours[1]) : 0) + (minutes ? parseInt(minutes[1]) / 60 : 0);
  };
  
  return trades.map(t => ({
    rMultiple: t.rMultiple,
    pnl: t.pnl,
    holdTime: parseHoldTime(t.holdTime),
    symbol: t.symbol,
    isWin: t.pnl > 0
  }));
};

// Generate day of week performance
export const generateDayPerformance = (trades: Trade[]): DayPerformance[] => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return days.map(day => {
    const dayTrades = trades.filter(t => {
      const tradeDay = t.date.toLocaleDateString('en-US', { weekday: 'short' });
      return tradeDay === day;
    });
    
    const winRate = dayTrades.length > 0 
      ? (dayTrades.filter(t => t.pnl > 0).length / dayTrades.length) * 100 
      : 0;
    const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    return { day, trades: dayTrades.length, winRate, pnl };
  });
};

// Generate hour of day performance
export const generateHourPerformance = (): HourPerformance[] => {
  // Mock data since we don't have hour info in trades
  const hours = [];
  for (let i = 9; i <= 16; i++) {
    const hour = i <= 12 ? `${i}AM` : `${i - 12}PM`;
    hours.push({
      hour: i === 12 ? "12PM" : hour,
      trades: Math.floor(Math.random() * 15) + 5,
      pnl: (Math.random() - 0.3) * 800,
      winRate: 40 + Math.random() * 40
    });
  }
  return hours;
};

// Generate session performance
export const generateSessionPerformance = (trades: Trade[]): SessionPerformance[] => {
  // Mock session data
  return [
    { session: "Market Open (9:30-10:30)", trades: 12, winRate: 72, avgPnl: 245, totalPnl: 2940 },
    { session: "Mid-Day (10:30-14:00)", trades: 18, winRate: 58, avgPnl: 85, totalPnl: 1530 },
    { session: "Power Hour (15:00-16:00)", trades: 8, winRate: 65, avgPnl: 180, totalPnl: 1440 },
  ];
};

// Generate strategy performance data
export const generateStrategyPerformance = (trades: Trade[]): StrategyPerformance[] => {
  const strategies = [...new Set(trades.map(t => t.strategy))];
  
  return strategies.map(strategy => {
    const strategyTrades = trades.filter(t => t.strategy === strategy);
    const wins = strategyTrades.filter(t => t.pnl > 0);
    const losses = strategyTrades.filter(t => t.pnl < 0);
    
    const totalPnl = strategyTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnl = strategyTrades.length > 0 ? totalPnl / strategyTrades.length : 0;
    const winRate = strategyTrades.length > 0 ? (wins.length / strategyTrades.length) * 100 : 0;
    
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Mock max drawdown
    const maxDrawdown = Math.random() * 15 + 5;
    
    return {
      name: strategy,
      trades: strategyTrades.length,
      winRate,
      profitFactor: Number(profitFactor.toFixed(2)),
      avgPnl,
      totalPnl,
      maxDrawdown
    };
  }).sort((a, b) => b.totalPnl - a.totalPnl);
};

// Calculate overview stats
export const calculateOverviewStats = (trades: Trade[]) => {
  const closedTrades = trades.filter(t => t.status === "closed");
  const wins = closedTrades.filter(t => t.pnl > 0);
  const losses = closedTrades.filter(t => t.pnl < 0);
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  // Calculate max drawdown from equity curve
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  
  const sortedTrades = [...closedTrades].sort((a, b) => a.date.getTime() - b.date.getTime());
  sortedTrades.forEach(trade => {
    cumulative += trade.pnl;
    peak = Math.max(peak, cumulative);
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });
  
  return {
    totalPnl,
    winRate,
    profitFactor: Number(profitFactor.toFixed(2)),
    avgRR: Number(avgRR.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(1)),
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length
  };
};

// Generate AI insights based on data
export const generateAIInsights = (trades: Trade[], tab: string): AIInsight => {
  const insights: Record<string, AIInsight[]> = {
    overview: [
      { type: "positive", message: "Your win rate has improved by 8% this month compared to last month." },
      { type: "negative", message: "Your average loss size is 1.4x larger than your average win. Consider tightening stop losses." },
      { type: "neutral", message: "You've taken 23 trades this month, averaging 5.75 trades per week." },
    ],
    tradeAnalysis: [
      { type: "negative", message: "Trades held longer than 6 hours show a 40% lower win rate. Consider shorter holding periods." },
      { type: "positive", message: "Your best R-multiple trades occur with momentum setups. Consider focusing on these." },
      { type: "neutral", message: "Your PnL distribution shows most trades fall between -$200 and +$500." },
    ],
    strategyAnalysis: [
      { type: "positive", message: "Breakout strategy outperforms with a 2.1 profit factor. Consider allocating more capital." },
      { type: "negative", message: "Reversal strategy shows a negative expectancy. Review entry criteria or consider pausing." },
      { type: "neutral", message: "You're using 6 different strategies. Consider focusing on your top 3 performers." },
    ],
    timeAnalysis: [
      { type: "negative", message: "Your win rate drops significantly after 1 PM. Consider reducing position sizes in afternoon." },
      { type: "positive", message: "Tuesday and Thursday show the highest win rates. These may be your strongest trading days." },
      { type: "neutral", message: "Market open (9:30-10:30) accounts for 35% of your total profits." },
    ],
  };
  
  const tabInsights = insights[tab] || insights.overview;
  return tabInsights[Math.floor(Math.random() * tabInsights.length)];
};

// Get best and worst trades
export const getBestWorstTrades = (trades: Trade[], count: number = 5) => {
  const sorted = [...trades].sort((a, b) => b.pnl - a.pnl);
  return {
    best: sorted.slice(0, count),
    worst: sorted.slice(-count).reverse()
  };
};
