import { Copy } from "@phosphor-icons/react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProfitFactorGauge } from "@/components/dashboard/ProfitFactorGauge";
import { WinRateDonut } from "@/components/dashboard/WinRateDonut";
import { AvgWinLossBar } from "@/components/dashboard/AvgWinLossBar";
import { PerformanceCharts } from "@/components/dashboard/PerformanceChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings

const Dashboard = () => {
  // 🔥 FETCH REAL DATA (Default to 1 Month view)
  const { stats, isLoading } = useDashboardStats({ dateRange: "1M" });

  // ✅ 2. Use the Global Formatter (Handles conversion & symbols)
  const { formatCurrency } = useSettings();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="p-6 lg:p-8">

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* 1. Net P&L (Currency Converted) */}
        <MetricCard
          title="Net P&L"
          value={formatCurrency(stats.netPnl)} 
          trend={{ 
            value: `${Math.abs(stats.periodChangePercent).toFixed(1)}%`, 
            positive: stats.periodChangePercent >= 0 
          }}
          variant={stats.netPnl >= 0 ? "positive" : "negative"}
          icon={
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Copy weight="light" className="w-4 h-4 text-muted-foreground" />
            </div>
          }
        />

        {/* 2. Trade Expectancy (Currency Converted) */}
        <MetricCard
          title="Trade Expectancy"
          value={formatCurrency(stats.expectancy)}
          subtitle="Per trade"
          trend={{ 
            value: `${Math.abs(stats.expectancyChange).toFixed(1)}%`, 
            positive: stats.expectancyChange >= 0 
          }}
          variant={stats.expectancy >= 0 ? "positive" : "negative"}
        />

        {/* 3. Profit Factor (Ratio - No Currency) */}
        <MetricCard
          title="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          subtitle="Quality indicator"
        >
          <ProfitFactorGauge value={stats.profitFactor} />
        </MetricCard>

        {/* 4. Win Rate (Percentage) */}
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.winningTrades} wins / ${stats.losingTrades} losses`}
        >
          <WinRateDonut wins={stats.winningTrades} losses={stats.losingTrades} />
        </MetricCard>

        {/* 5. Avg Win/Loss (Ratio - No Currency needed for main value) */}
        <MetricCard
          title="Avg Win/Loss"
          value={stats.avgWinLossRatio.toFixed(2)}
          subtitle="Risk/reward ratio"
        >
          {/* Note: We pass raw numbers here. The Bar chart itself should handle formatting internally if it shows tooltips */}
          <AvgWinLossBar avgWin={stats.avgWin} avgLoss={stats.avgLoss} />
        </MetricCard>
      </div>

      {/* Charts */}
      <PerformanceCharts />

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentTrades />
        <MiniCalendar />
      </div>
    </div>
  );
};

export default Dashboard;