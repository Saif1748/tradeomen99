import { Strategy as ApiStrategy } from "@/services/api";
import { Trade as UiTrade } from "@/lib/tradesData";
import { Strategy as UiStrategy } from "@/lib/strategiesData";
import { Trade } from "@/lib/tradesData";

// Define the shape of data coming from your API (snake_case)
export interface ApiTrade {
  id: string;
  created_at?: string;
  entry_time: string;
  symbol: string;
  instrument_type: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  target?: number;
  quantity: number;
  fees?: number;
  pnl?: number;
  notes?: string;
  strategy_id?: string;
  status: string;
  tags?: string[];
  // Add other backend fields if necessary
}

export const adaptTradeToUi = (apiTrade: ApiTrade): Trade => {
  return {
    id: apiTrade.id,
    date: new Date(apiTrade.entry_time), // Convert string to Date
    symbol: apiTrade.symbol,
    // Capitalize first letter for UI consistency (crypto -> Crypto)
    type: (apiTrade.instrument_type.charAt(0).toUpperCase() + apiTrade.instrument_type.slice(1).toLowerCase()) as any,
    side: apiTrade.direction,
    entryPrice: apiTrade.entry_price,
    exitPrice: apiTrade.exit_price || 0,
    stopLoss: apiTrade.stop_loss || 0,
    target: apiTrade.target || 0,
    quantity: apiTrade.quantity,
    fees: apiTrade.fees || 0,
    pnl: apiTrade.pnl || 0,
    // Calculate R-Multiple if not provided by backend
    rMultiple: calculateRMultiple(apiTrade),
    strategy: apiTrade.strategy_id || "Manual",
    tags: apiTrade.tags || [],
    notes: apiTrade.notes || "",
    status: apiTrade.status.toLowerCase() as "open" | "closed",
    // UI specific placeholders
    holdTime: "N/A", 
    risk: 0 
  };
};

// Helper to calculate R-Multiple
const calculateRMultiple = (trade: ApiTrade): number => {
  if (!trade.exit_price || !trade.stop_loss || trade.entry_price === trade.stop_loss) return 0;
  
  const risk = Math.abs(trade.entry_price - trade.stop_loss);
  const reward = trade.exit_price - trade.entry_price;
  
  // Adjust calculation based on direction
  const r = trade.direction === "LONG" 
    ? reward / risk 
    : (trade.entry_price - trade.exit_price) / risk;
    
  return Number(r.toFixed(2));
};

// --- Strategy Adapter ---
export const adaptStrategyToUi = (apiStrategy: ApiStrategy & { stats?: any }): UiStrategy => {
  // Your old backend might return stats nested or separate. 
  // Assuming the backend returns stats attached or you fetch them separately.
  // For now, we map the core fields.
  
  const stats = apiStrategy.stats || {};

  return {
    id: apiStrategy.id,
    name: apiStrategy.name,
    icon: apiStrategy.emoji || "⚡",
    description: apiStrategy.description || "",
    style: apiStrategy.style || "Day Trading",
    instruments: apiStrategy.instrument_types || [],
    ruleGroups: [], // You might need to parse `apiStrategy.rules` into groups
    createdAt: apiStrategy.created_at,
    
    // Flatten stats for the UI
    totalTrades: stats.totalTrades || 0,
    winRate: stats.winRate || 0,
    netPnl: stats.netPL || 0,
    profitFactor: stats.profitFactor || 0,
    expectancy: 0, // Calculate if needed
    avgWin: stats.avgWinner || 0,
    avgLoss: stats.avgLoser || 0
  };
};
