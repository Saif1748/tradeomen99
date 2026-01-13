import { useState, useMemo } from "react";
import { Wallet, TrendUp, TrendDown } from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import GaugeMetric from "@/components/dashboard/GaugeMetric";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentTrades from "@/components/dashboard/RecentTrades";
import MiniCalendar from "@/components/dashboard/MiniCalendar";

import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { format, symbol } = useCurrency();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: stats, isLoading } = useDashboardStats();

  /* ===============================
     SYSTEM QUALITY = Avg Win / Avg Loss
     =============================== */
  const payoffRatio =
    stats?.avgLoss && Math.abs(stats.avgLoss) > 0
      ? Math.abs(stats.avgWin / stats.avgLoss)
      : 0;

  /* ===============================
     RADAR DATA (normalized)
     =============================== */
  const radarChartData = [
    { metric: "Win %", value: stats?.winRate || 0 },
    {
      metric: "Profit Factor",
      value: Math.min((stats?.profitFactor || 0) * 20, 100),
    },
    {
      metric: "Avg Win / Avg Loss",
      value: Math.min(payoffRatio * 20, 100),
    },
    { metric: "Long Win%", value: stats?.longWinRate || 0 },
    { metric: "Short Win%", value: stats?.shortWinRate || 0 },
  ];

  /* ===============================
     CHART DATA (currency converted)
     =============================== */
  const dailyData = useMemo(
    () =>
      (stats?.dailyData || []).map((d) => ({
        ...d,
        value: d.value,
      })),
    [stats]
  );

  const cumulativeData = useMemo(
    () =>
      (stats?.cumulativeData || []).map((d) => ({
        ...d,
        value: d.value,
      })),
    [stats]
  );

  const netPlTrend =
    stats?.netPL !== undefined && stats.netPL >= 0 ? "up" : "down";

  return (
    <DashboardLayout>
      <DashboardHeader
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Welcome */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's your real-time trading performance.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 space-y-4 sm:space-y-6">
        {/* === METRICS ROW === */}
        {isLoading ? (
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 h-[120px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="h-full w-full rounded-2xl bg-secondary/30"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {/* Net P&L */}
            <MetricCard
              title="Net P&L"
              value={`${symbol}${format(stats?.netPL || 0)}`}
              subtitle={`${stats?.totalTrades || 0} trades`}
              icon={<Wallet weight="regular" className="w-5 h-5" />}
              trend={netPlTrend}
              trendValue={
                stats?.profitFactor
                  ? `PF ${stats.profitFactor.toFixed(2)}`
                  : "0.00"
              }
            />

            {/* Expectancy */}
            <MetricCard
              title="Expectancy"
              value={`${symbol}${format(stats?.expectancy || 0)}`}
              subtitle="Per Trade"
              icon={
                stats?.expectancy !== undefined && stats.expectancy >= 0 ? (
                  <TrendUp className="text-emerald-500 w-5 h-5" />
                ) : (
                  <TrendDown className="text-rose-500 w-5 h-5" />
                )
              }
              trend="neutral"
              trendValue={
                payoffRatio ? `R:R ${payoffRatio.toFixed(2)}` : "0.00"
              }
            />

            {/* Profit Factor */}
            <GaugeMetric
              title="Profit Factor"
              value={stats?.profitFactor || 0}
              type="arc"
            />

            {/* Win Rate */}
            <GaugeMetric
              title="Win Rate"
              value={stats?.winRate || 0}
              type="donut"
            />

            {/* 🔥 FIXED SYSTEM QUALITY */}
            <GaugeMetric
              title="Avg Win / Avg Loss"
              value={payoffRatio}
              type="bar"
            />
          </div>
        )}

        {/* Mobile Gauges */}
        <div className="grid grid-cols-3 gap-2 xl:hidden">
          <GaugeMetric
            title="Profit Factor"
            value={stats?.profitFactor || 0}
            type="arc"
            compact
          />
          <GaugeMetric
            title="Win Rate"
            value={stats?.winRate || 0}
            type="donut"
            compact
          />
          <GaugeMetric
            title="Avg W / Avg L"
            value={payoffRatio}
            type="bar"
            compact
          />
        </div>

        {/* === CHARTS === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard
            title="Trading Personality"
            type="radar"
            data={radarChartData}
          />

          <ChartCard
            title="Equity Curve"
            type="area"
            data={cumulativeData}
            valueFormatter={(v) => `${symbol}${format(v)}`}
          />

          <ChartCard
            title="Daily P&L"
            type="bar"
            data={dailyData}
            valueFormatter={(v) => `${symbol}${format(v)}`}
          />
        </div>

        {/* === BOTTOM === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <RecentTrades />
          <MiniCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
