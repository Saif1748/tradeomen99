import { Crosshair, ChartBar, TrendUp, Lightning } from "@phosphor-icons/react";

interface StrategyStatsCardsProps {
  totalStrategies: number;
  combinedTrades: number;
  avgWinRate: number;
  totalPnl: number;
}

const StrategyStatsCards = ({
  totalStrategies,
  combinedTrades,
  avgWinRate,
  totalPnl
}: StrategyStatsCardsProps) => {
  const stats = [
    {
      icon: <Crosshair weight="regular" className="w-4 h-4 text-muted-foreground" />,
      label: "Total Strategies",
      value: totalStrategies.toString(),
      color: "text-primary"
    },
    {
      icon: <ChartBar weight="regular" className="w-4 h-4 text-muted-foreground" />,
      label: "Combined Trades",
      value: combinedTrades.toString(),
      color: "text-primary"
    },
    {
      icon: <TrendUp weight="regular" className="w-4 h-4 text-muted-foreground" />,
      label: "Avg Win Rate",
      value: `${avgWinRate.toFixed(1)}%`,
      color: avgWinRate >= 50 ? "text-emerald-400" : "text-rose-400"
    },
    {
      icon: <Lightning weight="regular" className="w-4 h-4 text-muted-foreground" />,
      label: "Total P&L",
      value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      color: totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            {stat.icon}
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-xl font-medium tracking-tight-premium ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StrategyStatsCards;
