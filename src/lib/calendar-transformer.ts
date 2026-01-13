import { DayData } from "@/lib/calendarData";
import { UITrade } from "@/hooks/use-trades";

/**
 * Transforms a list of trades into the Map structure required by CalendarGrid.
 */
export function transformTradesToCalendarData(
  trades: UITrade[], 
  notes: Map<string, string>
): Map<string, DayData> {
  
  const data = new Map<string, DayData>();

  trades.forEach((trade) => {
    // Group by date string (e.g. "Mon Jan 01 2024")
    const dateKey = trade.date.toDateString();
    
    if (!data.has(dateKey)) {
      data.set(dateKey, {
        date: trade.date,
        trades: [],
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0,
        emotion: 'neutral',
        bestStrategy: 'N/A',
        bestTrade: null,
        worstTrade: null
      });
    }

    const day = data.get(dateKey)!;
    
    // Adapt to internal Calendar Trade shape
    const calendarTrade = {
      id: trade.id,
      symbol: trade.symbol,
      direction: (trade.side?.toLowerCase() || 'long') as 'long' | 'short',
      pnl: trade.pnl || 0,
      entryTime: trade.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: '-', 
      strategy: trade.strategy
    };

    day.trades.push(calendarTrade);
    day.totalPnL += calendarTrade.pnl;
    day.tradeCount += 1;
  });

  // Calculate daily stats (Win Rate, Best Strategy, etc.)
  data.forEach((day) => {
    const wins = day.trades.filter(t => t.pnl > 0).length;
    day.winRate = day.tradeCount > 0 ? Math.round((wins / day.tradeCount) * 100) : 0;
    day.totalPnL = Math.round(day.totalPnL * 100) / 100;
    
    // Best Strategy
    const strategyCounts: Record<string, number> = {};
    day.trades.filter(t => t.pnl > 0).forEach(t => {
      strategyCounts[t.strategy] = (strategyCounts[t.strategy] || 0) + 1;
    });
    day.bestStrategy = Object.keys(strategyCounts).sort((a,b) => strategyCounts[b] - strategyCounts[a])[0] || 'N/A';

    // Emotion
    if (day.totalPnL > 0) day.emotion = 'positive';
    else if (day.totalPnL < 0) day.emotion = 'negative';
    
    // Attach user notes
    const note = notes.get(day.date.toDateString());
    if (note) day.note = note;
  });

  return data;
}