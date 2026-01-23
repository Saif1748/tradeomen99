import { useState } from "react";
import { Wallet, ChartBar } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageTitle from "@/components/dashboard/PageTitle";
import MetricCard from "@/components/dashboard/MetricCard";
import GaugeMetric from "@/components/dashboard/GaugeMetric";
import ChartCard from "@/components/dashboard/ChartCard";
import RecentTrades from "@/components/dashboard/RecentTrades";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import AddTradeModal from "@/components/trades/AddTradeModal";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import { useSettings } from "@/contexts/SettingsContext";
import { Trade } from "@/lib/tradesData";
import { Strategy } from "@/lib/strategiesData";
import { toast } from "sonner";

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
  const { formatCurrency, getCurrencySymbol } = useSettings();
  const [addTradeOpen, setAddTradeOpen] = useState(false);
  const [addStrategyOpen, setAddStrategyOpen] = useState(false);

  // Sample data - would come from API
  const netPnL = 2486.50;
  const isPositive = netPnL >= 0;

  const handleAddTrade = (newTrade: Omit<Trade, "id">) => {
    toast.success("Trade logged successfully!");
  };

  const handleCreateStrategy = (newStrategy: Omit<Strategy, 'id' | 'createdAt' | 'totalTrades' | 'winRate' | 'netPnl' | 'profitFactor' | 'expectancy' | 'avgWin' | 'avgLoss'>) => {
    toast.success("Strategy created successfully!");
  };

  const handleAddNote = () => {
    toast.info("Note feature coming soon!");
  };

  return (
    <DashboardLayout
      onAddTrade={() => setAddTradeOpen(true)}
      onAddStrategy={() => setAddStrategyOpen(true)}
      onAddNote={handleAddNote}
    >
      <PageTitle 
        title="Dashboard" 
        subtitle="Welcome back! Here's your trading overview."
        icon={<ChartBar weight="duotone" className="w-6 h-6 text-primary" />}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-2 space-y-4 sm:space-y-6">
        {/* Metrics Row - All same height */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <div className="h-[120px] sm:h-[130px]">
            <MetricCard
              title="Net P&L"
              value={`${isPositive ? '+' : ''}${getCurrencySymbol()}${Math.abs(netPnL).toLocaleString()}`}
              subtitle="12 trades this month"
              icon={<Wallet weight="fill" className="w-4 h-4 sm:w-5 sm:h-5" />}
              trend="up"
              trendValue="12.4%"
              variant={isPositive ? "positive" : "negative"}
            />
          </div>
          <div className="h-[120px] sm:h-[130px]">
            <MetricCard
              title="Trade Expectancy"
              value={`${getCurrencySymbol()}248.78`}
              subtitle="Per trade average"
              trend="up"
              trendValue="8.2%"
              variant="positive"
            />
          </div>
          <div className="hidden xl:block h-[120px] sm:h-[130px]">
            <GaugeMetric title="Profit Factor" value={1.82} type="arc" />
          </div>
          <div className="hidden xl:block h-[120px] sm:h-[130px]">
            <GaugeMetric title="Win Rate" value={68.5} type="donut" />
          </div>
          <div className="hidden xl:block h-[120px] sm:h-[130px]">
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

      {/* Modals */}
      <AddTradeModal
        open={addTradeOpen}
        onOpenChange={setAddTradeOpen}
        onAddTrade={handleAddTrade}
      />
      <CreateStrategyModal
        open={addStrategyOpen}
        onOpenChange={setAddStrategyOpen}
        onCreateStrategy={handleCreateStrategy}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
