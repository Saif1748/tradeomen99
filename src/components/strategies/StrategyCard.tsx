import { Strategy } from "@/types/strategy";

// --- Subcomponents ---
function WinRateBar({ rate }: { rate: number }) {
  const barColor = rate >= 60 ? "hsl(var(--success))" : rate >= 40 ? "hsl(38 92% 55%)" : "hsl(var(--loss))";
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-700" 
        style={{ width: `${rate}%`, backgroundColor: barColor }} 
      />
    </div>
  );
}

function StatRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const isColored = positive !== undefined;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${isColored ? (positive ? "text-success" : "text-loss") : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

// --- Main Component ---
interface StrategyCardProps {
  strategy: Strategy;
  onClick: () => void;
}

export default function StrategyCard({ strategy, onClick }: StrategyCardProps) {
  // ✅ Access nested metrics safely
  const { 
    winRate = 0, 
    totalPnl = 0, 
    totalTrades = 0, 
    profitFactor = 0,
    avgWin = 0,
    avgLoss = 0
  } = strategy.metrics || {};

  const winRateTextColor = winRate >= 60 ? "text-success" : winRate >= 40 ? "text-[hsl(38_92%_55%)]" : "text-loss";
  
  // Fallback for status and color if they don't exist in your type yet
  const statusStyles = (strategy as any).status === "paused"
    ? "bg-primary/12 text-primary"
    : "bg-success/12 text-success";
    
  const cardColor = (strategy as any).color || "#3b82f6";

  return (
    <div 
      onClick={onClick}
      className="group relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer card-boundary"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" 
            style={{ backgroundColor: `${cardColor}20` }}
          >
            {strategy.emoji || "🎯"}
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusStyles}`}>
            {(strategy as any).status || "active"}
          </span>
        </div>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1 tracking-tight truncate">
          {strategy.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {strategy.description || "No description provided."}
        </p>
      </div>

      {/* Win Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Win Rate</span>
          <span className={`text-sm font-bold tabular-nums ${winRateTextColor}`}>
            {winRate.toFixed(1)}%
          </span>
        </div>
        <WinRateBar rate={winRate} />
      </div>

      <div className="h-px bg-border" />

      {/* Stats */}
      <div className="space-y-0.5">
        <StatRow label="Trades" value={String(totalTrades)} />
        <StatRow
          label="Net PnL"
          value={totalPnl >= 0 ? `+$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          positive={totalPnl >= 0}
        />
        <StatRow label="Profit Factor" value={profitFactor.toFixed(2)} />
        <StatRow label="Avg Win" value={`+$${avgWin.toFixed(2)}`} positive={true} />
        <StatRow label="Avg Loss" value={`-$${Math.abs(avgLoss).toFixed(2)}`} positive={false} />
      </div>
    </div>
  );
}