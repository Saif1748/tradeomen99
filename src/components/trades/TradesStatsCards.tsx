import {
  ChartLineUp,
  CurrencyDollar,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { UITrade } from "@/hooks/use-trades";

interface TradesStatsCardsProps {
  trades: UITrade[];
}

// ⚡ Industry Grade Stats Calculation
const calculateStats = (trades: UITrade[]) => {
  const totalTrades = trades.length;
  const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
  const losses = trades.filter((t) => (t.pnl || 0) < 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const avgRMultiple = totalTrades > 0 
    ? trades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / totalTrades 
    : 0;
  
  const bestTrade = trades.length > 0 
    ? [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0] 
    : { pnl: 0, symbol: "N/A" };

  return { totalTrades, wins, losses, winRate, totalPnl, avgRMultiple, bestTrade };
};

const TradesStatsCards = ({ trades }: TradesStatsCardsProps) => {
  const stats = calculateStats(trades);

  // Helper for explicit signs
  const formatPnl = (val: number) => (val >= 0 ? "+" : "-") + `$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatR = (val: number) => (val >= 0 ? "+" : "-") + `${Math.abs(val).toFixed(2)}R`;

  const mobileCards = [
    {
      title: "Total P&L",
      value: formatPnl(stats.totalPnl),
      isPositive: stats.totalPnl >= 0,
      icon: <CurrencyDollar weight="regular" className="w-4 h-4" />,
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(0)}%`,
      subtitle: `${stats.wins}W / ${stats.losses}L`,
      icon: <Target weight="regular" className="w-4 h-4" />,
    },
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      icon: <ChartLineUp weight="regular" className="w-4 h-4" />,
    },
    {
      title: "Avg R",
      value: formatR(stats.avgRMultiple),
      isPositive: stats.avgRMultiple >= 0,
      icon: <TrendUp weight="regular" className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {mobileCards.map((card, index) => (
          <div key={index} className="glass-card p-3 rounded-xl border border-border/40 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className="text-primary/70">{card.icon}</div>
            </div>
            <p className={`text-lg font-bold tabular-nums ${
              card.title.includes("P&L") || card.title.includes("Avg R")
                ? card.isPositive ? "text-emerald-500" : "text-rose-500"
                : "text-foreground"
            }`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          {
            title: "Total Trades",
            value: stats.totalTrades.toString(),
            subtitle: "Filtered results",
            icon: <ChartLineUp weight="duotone" className="w-5 h-5" />,
          },
          {
            title: "Total P&L",
            value: formatPnl(stats.totalPnl),
            isPositive: stats.totalPnl >= 0,
            icon: <CurrencyDollar weight="duotone" className="w-5 h-5" />,
          },
          {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            subtitle: `${stats.wins} wins / ${stats.losses} losses`,
            icon: <Target weight="duotone" className="w-5 h-5" />,
          },
          {
            title: "Avg R-Multiple",
            value: formatR(stats.avgRMultiple),
            isPositive: stats.avgRMultiple >= 0,
            icon: <TrendUp weight="duotone" className="w-5 h-5" />,
          },
          {
            title: "Best Trade",
            value: formatPnl(stats.bestTrade.pnl || 0),
            subtitle: stats.bestTrade.symbol || "N/A",
            isPositive: (stats.bestTrade.pnl || 0) >= 0,
            icon: <CurrencyDollar weight="duotone" className="w-5 h-5" />,
          },
        ].map((card, index) => (
          <div key={index} className="glass-card p-5 rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className="text-primary bg-primary/10 p-1.5 rounded-lg">{card.icon}</div>
            </div>
            <div>
              <p className={`text-2xl font-bold tabular-nums tracking-tight ${
                card.title.includes("P&L") || card.title.includes("R-Multiple") || card.title === "Best Trade"
                  ? card.isPositive ? "text-emerald-500" : "text-rose-500"
                  : "text-foreground"
              }`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs font-medium text-muted-foreground mt-1.5 opacity-80">
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradesStatsCards;