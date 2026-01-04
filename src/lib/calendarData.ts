// Dummy data generator for trading calendar

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  pnl: number;
  entryTime: string;
  exitTime: string;
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

const strategies = ['Breakout', 'Mean Reversion', 'Momentum', 'Scalping', 'Swing'];
const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ'];
const emotions: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateTrade(date: Date, index: number): Trade {
  const direction = Math.random() > 0.5 ? 'long' : 'short';
  const isWin = Math.random() > 0.4;
  const pnl = isWin 
    ? randomBetween(50, 800) 
    : randomBetween(-500, -20);
  
  return {
    id: `${date.toISOString()}-${index}`,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    direction,
    pnl: Math.round(pnl * 100) / 100,
    entryTime: `${9 + Math.floor(Math.random() * 6)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`,
    exitTime: `${1 + Math.floor(Math.random() * 4)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} PM`,
    strategy: strategies[Math.floor(Math.random() * strategies.length)],
  };
}

export function generateDayData(date: Date): DayData | null {
  // 30% chance of no trades
  if (Math.random() < 0.3) {
    return null;
  }

  // Generate 1-8 trades
  const tradeCount = Math.floor(randomBetween(1, 9));
  const trades: Trade[] = [];
  
  for (let i = 0; i < tradeCount; i++) {
    trades.push(generateTrade(date, i));
  }

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = (winCount / trades.length) * 100;
  
  // Find best and worst trades
  const sortedTrades = [...trades].sort((a, b) => b.pnl - a.pnl);
  const bestTrade = sortedTrades[0] || null;
  const worstTrade = sortedTrades[sortedTrades.length - 1] || null;
  
  // Determine best strategy (most used winning strategy)
  const strategyWins: Record<string, number> = {};
  trades.filter(t => t.pnl > 0).forEach(t => {
    strategyWins[t.strategy] = (strategyWins[t.strategy] || 0) + 1;
  });
  const bestStrategy = Object.entries(strategyWins).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Emotion based on P&L
  let emotion: 'positive' | 'neutral' | 'negative';
  if (totalPnL > 200) emotion = 'positive';
  else if (totalPnL < -100) emotion = 'negative';
  else emotion = 'neutral';

  return {
    date,
    trades,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: Math.round(winRate),
    tradeCount,
    emotion,
    bestStrategy,
    bestTrade,
    worstTrade,
  };
}

export function generateMonthData(year: number, month: number): Map<string, DayData> {
  const data = new Map<string, DayData>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    // Only generate data for days up to today
    if (date > new Date()) {
      continue;
    }
    const dayData = generateDayData(date);
    if (dayData) {
      data.set(date.toDateString(), dayData);
    }
  }
  
  return data;
}

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
