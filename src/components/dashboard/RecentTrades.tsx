import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTrades, UITrade } from "@/hooks/use-trades";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

const RecentTrades = () => {
  const navigate = useNavigate();
  // Fetch only the 5 most recent trades
  const { trades, isLoading } = useTrades({ page: 1, limit: 5 });
  // Get format function AND symbol from context
  const { format: formatCurrency, symbol } = useCurrency();

  if (isLoading) {
    return (
      <div className="glass-card card-glow p-5 rounded-2xl h-full flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-light text-foreground">Recent Trades</h3>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card card-glow p-5 rounded-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-light text-foreground">Recent Trades</h3>
        <button 
          onClick={() => navigate("/trades")}
          className="text-xs font-light text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {/* Header Row - Matching original styling exactly */}
        <div className="grid grid-cols-4 text-[10px] font-light text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
          <span>Date</span>
          <span>Symbol</span>
          <span>Type</span>
          <span className="text-right">P&L</span>
        </div>

        {/* Data Rows */}
        {trades.length > 0 ? (
          trades.map((trade: UITrade) => {
            const pnl = trade.pnl || 0;
            const isWin = pnl >= 0;
            
            return (
              <div
                key={trade.id}
                className="grid grid-cols-4 text-sm font-light items-center py-2 hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate("/trades")}
              >
                <span className="text-muted-foreground text-xs">
                  {format(trade.date, "MMM d, yyyy")}
                </span>
                
                <span className="text-foreground font-normal truncate pr-2">
                  {trade.symbol}
                </span>
                
                <span
                  className={`text-xs px-2 py-0.5 rounded w-fit ${
                    trade.side === "LONG"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {/* Displaying Side (Long/Short) under 'Type' column to match original design intent */}
                  {trade.side}
                </span>
                
                <span
                  className={`text-right font-normal ${
                    isWin ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {/* Added symbol and sign logic: e.g. +$248.50 or -$85.20 */}
                  {isWin ? "+" : "-"}{symbol}{formatCurrency(Math.abs(pnl))}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-xs font-light">
            No trades recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTrades;