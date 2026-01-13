import { useState } from "react";
import { Wallet, TrendUp, TrendDown } from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import GaugeMetric from "@/components/dashboard/GaugeMetric";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentTrades from "@/components/dashboard/RecentTrades";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import { useSettings } from "@/contexts/SettingsContext";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    to: new Date(),
  });

  // Fetch Real Data via Hook
  const { data: stats, isLoading } = useDashboardStats();

  // --- Transform Data for Charts ---

  // 1. Radar Chart: Metrics vs "Ideal" (Normalized roughly to 100 for display)
  // Logic: 
  // - Win Rate is already 0-100
  // - Profit Factor: 2.0+ is great, so we scale it. 5.0 -> 100
  // - SQN: 2.5 is good, 5.0+ is holy grail. 5.0 -> 100
  const radarChartData = [
    { metric: "Win %", value: stats?.winRate || 0 },
    { metric: "Profit Factor", value: Math.min((stats?.profitFactor || 0) * 20, 100) }, 
    { metric: "SQN", value: Math.min((stats?.sqn || 0) * 20, 100) }, 
    { metric: "Long Win%", value: stats?.longWinRate || 0 },
    { metric: "Short Win%", value: stats?.shortWinRate || 0 },
  ];

  const netPlTrend = stats?.netPL && stats.netPL >= 0 ? "up" : "down";

  return (
    <DashboardLayout>
      <DashboardHeader 
        onMobileMenuOpen={() => setMobileMenuOpen(true)} 
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Welcome Message */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's your real-time trading performance.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 space-y-4 sm:space-y-6">
        
        {/* === METRICS ROW === */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 h-[120px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-full w-full rounded-2xl bg-secondary/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            
            {/* 1. Net P&L */}
            <div className="h-[120px]">
              <MetricCard
                title="Net P&L"
                value={`${getCurrencySymbol()}${formatCurrency(stats?.netPL || 0)}`}
                subtitle={`${stats?.totalTrades || 0} trades`}
                icon={<Wallet weight="regular" className="w-5 h-5" />}
                trend={netPlTrend}
                trendValue={stats?.profitFactor ? `PF ${stats.profitFactor}` : "0.00"}
              />
            </div>

            {/* 2. Expectancy */}
            <div className="h-[120px]">
              <MetricCard
                title="Expectancy"
                value={`${getCurrencySymbol()}${formatCurrency(stats?.expectancy || 0)}`}
                subtitle="Per Trade"
                icon={
                  stats?.expectancy && stats.expectancy >= 0 ? 
                  <TrendUp className="text-emerald-500 w-5 h-5" /> : 
                  <TrendDown className="text-rose-500 w-5 h-5" />
                }
                trend="neutral"
                trendValue={stats?.payoffRatio ? `R:R ${stats.payoffRatio}` : "0.00"}
              />
            </div>

            {/* 3. Gauge: Profit Factor */}
            <div className="hidden xl:block h-[120px]">
              <GaugeMetric 
                title="Profit Factor" 
                value={stats?.profitFactor || 0} 
                type="arc" 
              />
            </div>

            {/* 4. Gauge: Win Rate */}
            <div className="hidden xl:block h-[120px]">
              <GaugeMetric 
                title="Win Rate" 
                value={stats?.winRate || 0} 
                type="donut" 
              />
            </div>

            {/* 5. Gauge: SQN */}
            <div className="hidden xl:block h-[120px]">
              <GaugeMetric 
                title="System Quality (SQN)" 
                value={stats?.sqn || 0} 
                type="bar" 
              />
            </div>
          </div>
        )}

        {/* Mobile: Gauge metrics row */}
        <div className="grid grid-cols-3 gap-2 xl:hidden">
          <GaugeMetric title="Profit Factor" value={stats?.profitFactor || 0} type="arc" compact />
          <GaugeMetric title="Win Rate" value={stats?.winRate || 0} type="donut" compact />
          <GaugeMetric title="SQN" value={stats?.sqn || 0} type="bar" compact />
        </div>

        {/* === CHARTS ROW === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Radar: Trading Personality */}
          <ChartCard
            title="Trading Personality"
            type="radar"
            data={radarChartData}
          />

          {/* Area: Equity Curve */}
          <ChartCard
            title="Equity Curve"
            type="area"
            data={stats?.cumulativeData || []}
          />

          {/* Bar: Daily P&L */}
          <div className="lg:col-span-2 xl:col-span-1">
            <ChartCard
              title="Daily P&L"
              type="bar"
              data={stats?.dailyData || []}
            />
          </div>
        </div>

        {/* === BOTTOM ROW === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Recent Trades: Uses its own fetch logic via useTrades internally */}
          <RecentTrades /> 
          <MiniCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;