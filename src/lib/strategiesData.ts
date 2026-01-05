export interface RuleGroup {
  id: string;
  name: string;
  rules: string[];
}

export interface Strategy {
  id: string;
  name: string;
  icon: string;
  description: string;
  style: string;
  instruments: string[];
  ruleGroups: RuleGroup[];
  createdAt: string;
  // Computed stats (would come from trades in real app)
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
}

export const strategyIcons = [
  "📈", "📉", "💹", "📊", "🎯", "⚡", "🔥", "💎", "🚀", "🌙", "☀️", "🌊", "🦁", "🐢", "🕷️"
];

export const strategyStyles = [
  "Day Trading",
  "Swing Trading", 
  "Scalping",
  "Position Trading",
  "Momentum",
  "Mean Reversion",
  "Breakout",
  "Trend Following"
];

export const defaultRuleGroups: RuleGroup[] = [
  { id: "market-context", name: "Market Context", rules: [] },
  { id: "entry-triggers", name: "Entry Triggers", rules: [] },
  { id: "exit-targets", name: "Exit / Targets", rules: [] },
  { id: "risk-management", name: "Risk Management", rules: [] }
];

export const generateMockStrategies = (): Strategy[] => [
  {
    id: "1",
    name: "London Session Breakout",
    icon: "🌍",
    description: "Captures high-probability breakouts during the London session by trading liquidity expansion after consolidation.",
    style: "Day Trading",
    instruments: ["FOREX", "INDICES"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Wait for Asian session range to form",
          "Identify key support/resistance levels",
          "Check for major news events"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "Price breaks and closes above/below Asian session range",
          "Breakout candle has strong body (minimal wicks)",
          "Retest of breakout level holds (optional but preferred)",
          "Entry taken on next candle open or retest confirmation"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Primary target at 1.5R – 2R",
          "Partial take profit at 1R",
          "Exit fully if price returns back into range",
          "Close trade before New York session slowdown if not hit"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Risk 1% per trade maximum",
          "Stop loss below/above breakout candle"
        ] 
      }
    ],
    createdAt: "2024-01-15",
    totalTrades: 2,
    winRate: 50.0,
    netPnl: 211.67,
    profitFactor: 0.16,
    expectancy: -105.84,
    avgWin: 40.02,
    avgLoss: 251.69
  },
  {
    id: "2",
    name: "Morning Breakout",
    icon: "☀️",
    description: "Capitalizes on early morning momentum after the market open with tight risk management.",
    style: "Day Trading",
    instruments: ["STOCK", "CRYPTO"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Pre-market gap analysis",
          "Volume confirmation required"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "Break of pre-market high/low",
          "Strong opening candle with volume"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Target 2R minimum",
          "Trail stop after 1R achieved"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Max 2% risk per trade",
          "No trades after 11 AM"
        ] 
      }
    ],
    createdAt: "2024-02-20",
    totalTrades: 13,
    winRate: 92.0,
    netPnl: 11253.77,
    profitFactor: 32.59,
    expectancy: 865.71,
    avgWin: 967.50,
    avgLoss: 356.23
  },
  {
    id: "3",
    name: "ICT Silver Bullet",
    icon: "🎯",
    description: "Precision entry model based on ICT concepts focusing on fair value gaps and order blocks.",
    style: "Scalping",
    instruments: ["FOREX", "FUTURES"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Identify daily/weekly bias",
          "Wait for specific kill zones"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "Fair value gap fill",
          "Order block reaction",
          "Displacement followed by retracement"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Target liquidity pools",
          "Opposing order block as target"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Risk 0.5-1% per trade",
          "Stop loss at swing point"
        ] 
      }
    ],
    createdAt: "2024-03-10",
    totalTrades: 8,
    winRate: 75.0,
    netPnl: 3450.00,
    profitFactor: 2.8,
    expectancy: 431.25,
    avgWin: 620.00,
    avgLoss: 290.00
  },
  {
    id: "4",
    name: "Swing Trend Surfer",
    icon: "🌊",
    description: "Multi-day trend following strategy catching pullbacks on strong moving averages.",
    style: "Swing Trading",
    instruments: ["STOCK", "ETF"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Price above 50-day MA",
          "Higher highs and higher lows structure",
          "Sector relative strength > SPY"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "Pullback to 20-day MA or key Fibonacci level",
          "Bullish engulfing or hammer candle on daily"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Trail stop below previous weekly low",
          "Take profit at 3R extension"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Risk 2% of equity",
          "Wide stop loss (ATR based)"
        ] 
      }
    ],
    createdAt: "2024-03-15",
    totalTrades: 5,
    winRate: 60.0,
    netPnl: 4200.00,
    profitFactor: 2.1,
    expectancy: 840.00,
    avgWin: 1400.00,
    avgLoss: 600.00
  },
  {
    id: "5",
    name: "Crypto Momentum",
    icon: "🚀",
    description: "High volatility breakout strategy designed for altcoins during alt-season cycles.",
    style: "Momentum",
    instruments: ["CRYPTO"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Bitcoin dominance decreasing",
          "High social volume/trending",
          "24h volume > $100M"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "Breakout of multi-week consolidation",
          "1h candle close above resistance",
          "Volume spike > 2x average"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Aggressive trailing stop (4h lows)",
          "Take profit at psychological numbers"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Small position size (0.5% risk)",
          "Expect low win rate but huge winners"
        ] 
      }
    ],
    createdAt: "2024-04-01",
    totalTrades: 12,
    winRate: 41.0,
    netPnl: 8500.00,
    profitFactor: 3.5,
    expectancy: 708.33,
    avgWin: 2200.00,
    avgLoss: 350.00
  },
  {
    id: "6",
    name: "Gap Fill Reversal",
    icon: "📉",
    description: "Fades morning gaps on indices when price fails to sustain the opening momentum.",
    style: "Mean Reversion",
    instruments: ["FUTURES", "INDICES"],
    ruleGroups: [
      { 
        id: "market-context", 
        name: "Market Context", 
        rules: [
          "Gap > 0.5% at open",
          "Price hits major resistance/support level immediately"
        ] 
      },
      { 
        id: "entry-triggers", 
        name: "Entry Triggers", 
        rules: [
          "5m candle reversal pattern (Shooting Star/Hammer)",
          "Failure to break opening range in first 15m"
        ] 
      },
      { 
        id: "exit-targets", 
        name: "Exit / Targets", 
        rules: [
          "Gap fill (yesterday's close)",
          "VWAP"
        ] 
      },
      { 
        id: "risk-management", 
        name: "Risk Management", 
        rules: [
          "Hard stop at high/low of day",
          "1.5% risk per trade"
        ] 
      }
    ],
    createdAt: "2024-04-10",
    totalTrades: 20,
    winRate: 65.0,
    netPnl: 2800.00,
    profitFactor: 1.8,
    expectancy: 140.00,
    avgWin: 300.00,
    avgLoss: 160.00
  }
];

export const calculateStrategyStats = (strategies: Strategy[]) => {
  const totalStrategies = strategies.length;
  const combinedTrades = strategies.reduce((acc, s) => acc + s.totalTrades, 0);
  const avgWinRate = strategies.reduce((acc, s) => acc + s.winRate, 0) / totalStrategies;
  const totalPnl = strategies.reduce((acc, s) => acc + s.netPnl, 0);
  
  return {
    totalStrategies,
    combinedTrades,
    avgWinRate,
    totalPnl
  };
};