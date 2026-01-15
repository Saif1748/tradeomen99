import { Strategy } from "@/lib/strategiesData";
// ✅ Fix: Import from the new hook file
import { useCurrency } from "@/hooks/use-currency";

interface StrategyCardProps {
  strategy: Strategy;
  onClick: () => void;
}

const StrategyCard = ({ strategy, onClick }: StrategyCardProps) => {
  // ✅ Fix: Use Global Currency Hook for formatting
  const { format, symbol } = useCurrency();

  // --- 1. Defensive Fallbacks ---
  const winRate = strategy.winRate ?? 0;
  const netPnl = strategy.netPnl ?? 0;
  const totalTrades = strategy.totalTrades ?? 0;
  const profitFactor = strategy.profitFactor ?? 0;
  const expectancy = strategy.expectancy ?? 0;
  const avgWin = strategy.avgWin ?? 0;
  const avgLoss = strategy.avgLoss ?? 0;

  // --- 2. Original Design Logic ---
  const winRateColor = winRate >= 70 ? "stroke-primary" : winRate >= 50 ? "stroke-amber-400" : "stroke-rose-400";
  const pnlColor = netPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const avgWinColor = "text-emerald-400";
  const avgLossColor = "text-rose-400";
  
  // Calculate stroke dasharray for win rate circle
  const circumference = 2 * Math.PI * 32;
  const strokeDasharray = `${(winRate / 100) * circumference} ${circumference}`;

  return (
    <div
      onClick={onClick}
      className="glass-card card-glow p-5 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{strategy.icon || strategy.emoji}</span>
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
              r="32"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            <circle
              cx="36"
              cy="36"
              r="32"
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
          <p className="text-xs text-muted-foreground uppercase tracking-wider">NET P&L ({symbol})</p>
          <p className={`text-xl font-medium ${pnlColor}`}>
            {netPnl >= 0 ? '+' : ''}{symbol}{format(Math.abs(netPnl))}
          </p>
          <p className="text-xs text-muted-foreground">{strategy.style}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">PROFIT FACTOR</p>
          <p className="text-foreground font-medium">
            {profitFactor >= 100 ? "100.00+" : profitFactor.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">EXPECTANCY</p>
          <p className={expectancy >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {expectancy >= 0 ? '+' : '-'}{symbol}{format(Math.abs(expectancy))}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">AVG WIN</p>
          <p className={avgWinColor}>+{symbol}{format(Math.abs(avgWin))}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider">AVG LOSS</p>
          <p className={avgLossColor}>-{symbol}{format(Math.abs(avgLoss))}</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyCard;