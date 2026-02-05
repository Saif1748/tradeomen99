import { Strategy } from "@/types/strategy";

interface StrategyCardProps {
  strategy: Strategy;
  onClick: () => void;
}

const StrategyCard = ({ strategy, onClick }: StrategyCardProps) => {
  // ✅ Access nested metrics safely
  const { 
    winRate = 0, 
    totalPnl = 0, 
    totalTrades = 0, 
    profitFactor = 0 
  } = strategy.metrics || {};

  // Color Logic
  const winRateColor = winRate >= 70 ? "stroke-primary" : winRate >= 50 ? "stroke-amber-400" : "stroke-rose-400";
  const pnlColor = totalPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  
  // Calculate stroke dasharray for win rate circle
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(winRate / 100) * circumference} ${circumference}`;

  return (
    <div
      onClick={onClick}
      className="glass-card card-glow p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{strategy.emoji || "⚡"}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground tracking-tight-premium truncate">
            {strategy.name}
          </h3>
          <span className="text-xs text-muted-foreground">
            {totalTrades} trades
          </span>
        </div>
      </div>

      {/* Win Rate & P&L */}
      <div className="flex items-center gap-4 mb-4">
        {/* Win Rate Donut */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              className={winRateColor}
              strokeWidth="4"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-foreground">{Math.round(winRate)}%</span>
            <span className="text-[10px] text-muted-foreground">WIN</span>
          </div>
        </div>

        {/* P&L */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">NET P&L</p>
          <p className={`text-xl font-medium ${pnlColor}`}>
            {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] px-1.5 py-0.5 bg-secondary/50 rounded text-muted-foreground uppercase">
               {strategy.style?.replace("_", " ") || "GENERAL"}
             </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-border/30 pt-3">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">PROFIT FACTOR</p>
          <p className="text-foreground font-medium">{profitFactor.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">ASSETS</p>
          <p className="text-foreground font-medium truncate">
            {strategy.assetClasses?.join(", ") || "All"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyCard;