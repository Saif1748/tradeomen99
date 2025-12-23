const trades = [
  { date: "Dec 23, 2024", symbol: "AAPL", type: "Long", pnl: 248.50, status: "win" },
  { date: "Dec 22, 2024", symbol: "TSLA", type: "Short", pnl: -85.20, status: "loss" },
  { date: "Dec 21, 2024", symbol: "SPY", type: "Long", pnl: 156.75, status: "win" },
  { date: "Dec 20, 2024", symbol: "NVDA", type: "Long", pnl: 312.00, status: "win" },
  { date: "Dec 19, 2024", symbol: "META", type: "Short", pnl: -42.30, status: "loss" },
];

const RecentTrades = () => {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-light text-foreground">Recent Trades</h3>
        <button className="text-xs font-light text-primary hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-4 text-[10px] font-light text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
          <span>Date</span>
          <span>Symbol</span>
          <span>Type</span>
          <span className="text-right">P&L</span>
        </div>

        {trades.map((trade, index) => (
          <div
            key={index}
            className="grid grid-cols-4 text-sm font-light items-center py-2 hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors"
          >
            <span className="text-muted-foreground text-xs">{trade.date}</span>
            <span className="text-foreground font-normal">{trade.symbol}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded w-fit ${
                trade.type === "Long"
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-rose-400/10 text-rose-400"
              }`}
            >
              {trade.type}
            </span>
            <span
              className={`text-right font-normal ${
                trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;
