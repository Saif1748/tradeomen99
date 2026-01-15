import {
  ChartLineUp,
  CurrencyDollar,
  Target,
  TrendUp,
} from "@phosphor-icons/react";
import { UITrade } from "@/hooks/use-trades";
// ✅ Fix: Import from the new hook file
import { useCurrency } from "@/hooks/use-currency";
// ✅ Fix: Reuse Dashboard's MetricCard for consistent UI
import MetricCard from "@/components/dashboard/MetricCard";

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
  
  // ✅ Fix: Use Global Currency Hook
  const { format, symbol } = useCurrency();

  // Helper for explicit signs with currency
  const formatPnl = (val: number) => (val >= 0 ? "+" : "-") + symbol + format(Math.abs(val));
  const formatR = (val: number) => (val >= 0 ? "+" : "-") + `${Math.abs(val).toFixed(2)}R`;

  const cards = [
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      subtitle: "Filtered results",
      icon: <ChartLineUp weight="regular" className="w-5 h-5" />,
      trend: "neutral",
      trendValue: null
    },
    {
      title: "Total P&L",
      value: formatPnl(stats.totalPnl),
      subtitle: `${stats.wins} wins / ${stats.losses} losses`,
      icon: <CurrencyDollar weight="regular" className="w-5 h-5" />,
      trend: stats.totalPnl >= 0 ? "up" : "down",
      trendValue: null
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      subtitle: "Target: >50%",
      icon: <Target weight="regular" className="w-5 h-5" />,
      trend: stats.winRate >= 50 ? "up" : "down",
      trendValue: null
    },
    {
      title: "Avg R-Multiple",
      value: formatR(stats.avgRMultiple),
      subtitle: "Risk / Reward",
      icon: <TrendUp weight="regular" className="w-5 h-5" />,
      trend: stats.avgRMultiple >= 0 ? "up" : "down",
      trendValue: null
    },
    {
      title: "Best Trade",
      value: formatPnl(stats.bestTrade.pnl || 0),
      subtitle: stats.bestTrade.symbol || "N/A",
      icon: <CurrencyDollar weight="regular" className="w-5 h-5" />,
      trend: (stats.bestTrade.pnl || 0) >= 0 ? "up" : "down",
      trendValue: null
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {cards.slice(0, 4).map((card, index) => (
          <div key={index} className="glass-card p-3 rounded-xl border border-border/40 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className="text-primary/70">{card.icon}</div>
            </div>
            <p className={`text-lg font-bold tabular-nums ${
              card.trend === "up" ? "text-emerald-500" : card.trend === "down" ? "text-rose-500" : "text-foreground"
            }`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Grid - Using the same MetricCard component as Dashboard for consistency */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            // Use basic trend logic for coloring
            trend={card.trend as "up" | "down" | "neutral"}
            trendValue={card.trendValue || ""}
          />
        ))}
      </div>
    </div>
  );
};

export default TradesStatsCards;