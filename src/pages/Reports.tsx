import { useState, useMemo } from "react";
import { ChartLine } from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsFilters from "@/components/reports/ReportsFilters";
import OverviewTab from "@/components/reports/OverviewTab";
import TradeAnalysisTab from "@/components/reports/TradeAnalysisTab";
import StrategyAnalysisTab from "@/components/reports/StrategyAnalysisTab";
import TimeAnalysisTab from "@/components/reports/TimeAnalysisTab";
import { generateMockTrades, Trade, strategies as tradeStrategies } from "@/lib/tradesData";
import { toast } from "sonner";

const Reports = () => {
  const [trades] = useState<Trade[]>(generateMockTrades());
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 10, 1),
    to: new Date(2024, 11, 31),
  });
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");

  // Filter trades based on selected filters
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Date filter
      if (dateRange?.from && trade.date < dateRange.from) return false;
      if (dateRange?.to && trade.date > dateRange.to) return false;
      
      // Instrument filter
      if (instrumentFilter !== "all" && trade.type !== instrumentFilter) return false;
      
      // Strategy filter
      if (strategyFilter !== "all" && trade.strategy !== strategyFilter) return false;
      
      return true;
    });
  }, [trades, dateRange, instrumentFilter, strategyFilter]);

  const handleExport = (format: "csv" | "pdf") => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // Export logic would go here
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium text-foreground tracking-tight-premium flex items-center gap-3">
                <ChartLine weight="regular" className="w-7 h-7 text-primary" />
                Reports
              </h1>
              <p className="text-muted-foreground mt-1">
                Performance insights from your trading data
              </p>
            </div>
          </div>

          {/* Filters */}
          <ReportsFilters
            dateRange={dateRange}
            setDateRange={setDateRange}
            instrumentFilter={instrumentFilter}
            setInstrumentFilter={setInstrumentFilter}
            strategyFilter={strategyFilter}
            setStrategyFilter={setStrategyFilter}
            strategies={tradeStrategies}
            onExport={handleExport}
          />
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/50 border border-border p-1 rounded-xl w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
            <TabsTrigger 
              value="overview"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-4 py-2 text-sm transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="trade-analysis"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-4 py-2 text-sm transition-all"
            >
              Trade Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="strategy-analysis"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-4 py-2 text-sm transition-all"
            >
              Strategy Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="time-analysis"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-4 py-2 text-sm transition-all"
            >
              Time Analysis
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab trades={filteredTrades} />
            </TabsContent>

            <TabsContent value="trade-analysis" className="mt-0">
              <TradeAnalysisTab trades={filteredTrades} />
            </TabsContent>

            <TabsContent value="strategy-analysis" className="mt-0">
              <StrategyAnalysisTab trades={filteredTrades} />
            </TabsContent>

            <TabsContent value="time-analysis" className="mt-0">
              <TimeAnalysisTab trades={filteredTrades} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
