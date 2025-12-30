import {
  ChartLineUp,
  CurrencyDollar,
  Target,
  TrendUp,
  Trophy,
} from "@phosphor-icons/react";
import { Trade, calculateTradeStats } from "@/lib/tradesData";
import { format } from "date-fns";

interface TradesStatsCardsProps {
  trades: Trade[];
}

const TradesStatsCards = ({ trades }: TradesStatsCardsProps) => {
  const stats = calculateTradeStats(trades);

  const cards = [
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      subtitle: "This month",
      icon: <ChartLineUp weight="regular" className="w-5 h-5" />,
    },
    {
      title: "Total P&L",
      value: `$${Math.abs(stats.totalPnl).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      trend: stats.totalPnl >= 0 ? ("up" as const) : ("down" as const),
      trendValue: "+18.2%",
      icon: <CurrencyDollar weight="regular" className="w-5 h-5" />,
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      subtitle: `${stats.wins} wins / ${stats.losses} losses`,
      icon: <Target weight="regular" className="w-5 h-5" />,
    },
    {
      title: "Avg R-Multiple",
      value: `${stats.avgRMultiple.toFixed(2)}R`,
      trend: stats.avgRMultiple >= 0 ? ("up" as const) : ("down" as const),
      trendValue: "+0.12R",
      icon: <TrendUp weight="regular" className="w-5 h-5" />,
    },
    {
      title: "Best Trade",
      value: `+$${stats.bestTrade.pnl.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `${stats.bestTrade.symbol} · ${format(stats.bestTrade.date, "MMM d")}`,
      icon: <Trophy weight="regular" className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="glass-card card-glow p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-light text-muted-foreground">
              {card.title}
            </span>
            <div className="text-primary">{card.icon}</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p
                className={`text-2xl font-normal tracking-tight-premium ${
                  card.title === "Best Trade" || card.title === "Total P&L"
                    ? stats.totalPnl >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : "text-foreground"
                }`}
              >
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs font-light text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
            {card.trend && card.trendValue && (
              <span
                className={`text-xs font-light px-2 py-1 rounded-lg ${
                  card.trend === "up"
                    ? "text-emerald-400 bg-emerald-400/10"
                    : "text-rose-400 bg-rose-400/10"
                }`}
              >
                {card.trendValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TradesStatsCards;
