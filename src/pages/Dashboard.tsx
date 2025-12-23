import { Wallet } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import GaugeMetric from "@/components/dashboard/GaugeMetric";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentTrades from "@/components/dashboard/RecentTrades";
import MiniCalendar from "@/components/dashboard/MiniCalendar";

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
  return (
    <DashboardLayout>
      <DashboardHeader />

      <div className="p-8 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Net P&L"
            value="$2,486.50"
            subtitle="12 trades"
            icon={<Wallet weight="regular" className="w-5 h-5" />}
            trend="up"
            trendValue="12.4%"
          />
          <MetricCard
            title="Trade Expectancy"
            value="$248.78"
            trend="up"
            trendValue="8.2%"
          />
          <GaugeMetric title="Profit Factor" value={1.82} type="arc" />
          <GaugeMetric title="Win Rate" value={68.5} type="donut" />
          <GaugeMetric title="Avg Win/Loss" value={1.83} type="bar" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
          <ChartCard
            title="Daily P&L"
            type="bar"
            data={barChartData}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentTrades />
          <MiniCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
