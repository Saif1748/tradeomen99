import { useState } from "react";
import { Wallet } from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import GaugeMetric from "@/components/dashboard/GaugeMetric";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentTrades from "@/components/dashboard/RecentTrades";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import { useSettings } from "@/contexts/SettingsContext";

// Sample data
const areaChartData = [
  { date: "Dec 1", value: 0 },
  { date: "Dec 5", value: 120 },
  { date: "Dec 9", value: 80 },
  { date: "Dec 13", value: 200 },
  { date: "Dec 17", value: -50 },
  { date: "Dec 21", value: 150 },
  { date: "Dec 23", value: 248 },
];

const barChartData = [
  { date: "Dec 18", positive: 120, negative: 0 },
  { date: "Dec 19", positive: 0, negative: -42 },
  { date: "Dec 20", positive: 156, negative: 0 },
  { date: "Dec 21", positive: 0, negative: -85 },
  { date: "Dec 22", positive: 248, negative: 0 },
  { date: "Dec 23", positive: 85, negative: 0 },
];

const radarChartData = [
  { metric: "Win %", value: 68 },
  { metric: "Profit Factor", value: 78 },
  { metric: "Avg Win/Loss", value: 85 },
  { metric: "Consistency", value: 72 },
  { metric: "Risk Mgmt", value: 80 },
];

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 11, 1),
    to: new Date(2024, 11, 31),
  });

  return (
    <DashboardLayout>
      <DashboardHeader 
        onMobileMenuOpen={() => setMobileMenuOpen(true)} 
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Welcome Message */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2">
        <p className="text-sm text-muted-foreground">Welcome back! Here's your trading overview.</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 space-y-4 sm:space-y-6">
        {/* Metrics Row - All same height */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <div className="h-[120px]">
            <MetricCard
              title="Net P&L"
              value={`${getCurrencySymbol()}2,486.50`}
              subtitle="12 trades"
              icon={<Wallet weight="regular" className="w-5 h-5" />}
              trend="up"
              trendValue="12.4%"
            />
          </div>
          <div className="h-[120px]">
            <MetricCard
              title="Trade Expectancy"
              value={`${getCurrencySymbol()}248.78`}
              trend="up"
              trendValue="8.2%"
            />
          </div>
          <div className="hidden xl:block h-[120px]">
            <GaugeMetric title="Profit Factor" value={1.82} type="arc" />
          </div>
          <div className="hidden xl:block h-[120px]">
            <GaugeMetric title="Win Rate" value={68.5} type="donut" />
          </div>
          <div className="hidden xl:block h-[120px]">
            <GaugeMetric title="Avg Win/Loss" value={1.83} type="bar" />
          </div>
        </div>

        {/* Mobile: Gauge metrics in a row */}
        <div className="grid grid-cols-3 gap-2 xl:hidden">
          <GaugeMetric title="Profit Factor" value={1.82} type="arc" compact />
          <GaugeMetric title="Win Rate" value={68.5} type="donut" compact />
          <GaugeMetric title="Avg W/L" value={1.83} type="bar" compact />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard
            title="Trading Score"
            type="radar"
            data={radarChartData}
          />
          <ChartCard
            title="Cumulative P&L"
            type="area"
            data={areaChartData}
          />
          <div className="lg:col-span-2 xl:col-span-1">
            <ChartCard
              title="Daily P&L"
              type="bar"
              data={barChartData}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <RecentTrades />
          <MiniCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;