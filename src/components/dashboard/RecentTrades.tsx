import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { useTrades } from "@/hooks/useTrades";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings Context

export const RecentTrades = () => {
  const navigate = useNavigate();
  const { activeAccount } = useWorkspace();
  const { profile } = useUser();
  
  // ✅ 2. Get the global currency formatter
  const { formatCurrency } = useSettings();

  // 🔥 FETCH REAL DATA (Shared Cache)
  const { trades, isLoading } = useTrades(activeAccount?.id, profile?.uid);

  // Take the latest 5 trades
  const recentTrades = trades.slice(0, 5);

  if (isLoading) {
    return (
      <div className="glass-card card-glow p-5 rounded-2xl h-full min-h-[300px] flex items-center justify-center">
        <CircleNotch className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card card-glow overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Recent Trades</h3>
        <button 
          onClick={() => navigate("/trades")}
          className="group flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All 
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        {recentTrades.length === 0 ? (
           <div className="p-8 text-center text-muted-foreground opacity-60 text-sm">
             No trades recorded yet.
           </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Symbol</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Entry</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Exit</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">P&L</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => {
                const isLong = trade.direction === "LONG";
                const pnl = trade.netPnl || 0;
                const isPositive = pnl >= 0;
                
                // Handle Date (Firestore Timestamp vs Date object)
                const tradeDate = trade.entryDate instanceof Date 
                    ? trade.entryDate 
                    : trade.entryDate.toDate();

                return (
                  <tr 
                    key={trade.id} 
                    onClick={() => navigate("/trades")}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(tradeDate, "MMM dd, yyyy")}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
                        isLong 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {isLong ? (
                          <ArrowUp weight="bold" className="w-3 h-3" />
                        ) : (
                          <ArrowDown weight="bold" className="w-3 h-3" />
                        )}
                        {trade.direction}
                      </span>
                    </td>
                    {/* ✅ 3. Apply formatCurrency to Entry Price */}
                    <td className="p-4 text-sm text-muted-foreground tabular-nums">
                      {formatCurrency(trade.avgEntryPrice)}
                    </td>
                    {/* ✅ 4. Apply formatCurrency to Exit Price */}
                    <td className="p-4 text-sm text-muted-foreground tabular-nums">
                      {trade.avgExitPrice ? formatCurrency(trade.avgExitPrice) : "-"}
                    </td>
                    {/* ✅ 5. Apply formatCurrency to P&L */}
                    <td className={`p-4 text-sm font-medium text-right tabular-nums ${
                      isPositive ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {isPositive ? "+" : ""}{formatCurrency(pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};