import { useState, useMemo } from "react";
import { 
  ChartLine, 
  Funnel, 
  Export, 
  CalendarBlank,
  SquaresFour,
  ChartBar,
  Strategy,
  Clock,
  Sparkle
} from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import OverviewTab from "@/components/reports/OverviewTab";
import TradeAnalysisTab from "@/components/reports/TradeAnalysisTab";
import StrategyAnalysisTab from "@/components/reports/StrategyAnalysisTab";
import TimeAnalysisTab from "@/components/reports/TimeAnalysisTab";
import AIInsightsTab from "@/components/reports/AIInsightsTab";
import { generateMockTrades, Trade, strategies as tradeStrategies } from "@/lib/tradesData";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { motion } from "framer-motion";

const Reports = () => {
  const [trades] = useState<Trade[]>(generateMockTrades());
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 10, 1),
    to: new Date(2024, 11, 31),
  });
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const { getCurrencySymbol } = useSettings();

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (dateRange?.from && trade.date < dateRange.from) return false;
      if (dateRange?.to && trade.date > dateRange.to) return false;
      if (instrumentFilter !== "all" && trade.type !== instrumentFilter) return false;
      if (strategyFilter !== "all" && trade.strategy !== strategyFilter) return false;
      return true;
    });
  }, [trades, dateRange, instrumentFilter, strategyFilter]);

  const hasActiveFilters = instrumentFilter !== "all" || strategyFilter !== "all";

  const dateRangeLabel = dateRange?.from 
    ? dateRange.to 
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Select dates";

  const handleExport = (type: "csv" | "pdf") => toast.success(`Exporting ${type}...`);
  const clearFilters = () => { setInstrumentFilter("all"); setStrategyFilter("all"); };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        icon={<ChartLine weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        {/* Filters Bar */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-secondary/50 border-border">
                <CalendarBlank weight="regular" className="w-4 h-4" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
              <Funnel weight="regular" className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Instrument" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Instruments</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Stock">Equity</SelectItem>
              <SelectItem value="Forex">Forex</SelectItem>
              <SelectItem value="Futures">Futures</SelectItem>
              <SelectItem value="Options">Options</SelectItem>
            </SelectContent>
          </Select>

          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Strategies</SelectItem>
              {tradeStrategies.map(strategy => (
                <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-secondary/50 border-border">
              <Export weight="regular" className="w-4 h-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-secondary/50 border-border">
              <Export weight="regular" className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Mobile Filters Trigger */}
        <div className="sm:hidden flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 justify-start gap-2 bg-secondary/50 border-border/50 text-xs"
          >
            <CalendarBlank weight="regular" className="w-4 h-4" />
            {dateRangeLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterSheetOpen(true)}
            className={`gap-1.5 bg-secondary/50 border-border/50 ${hasActiveFilters ? 'text-primary border-primary/50' : ''}`}
          >
            <Funnel weight={hasActiveFilters ? "fill" : "regular"} className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                {(instrumentFilter !== "all" ? 1 : 0) + (strategyFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* Tabs - 5 Columns */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
            <TabsList className="w-full h-auto p-1.5 bg-secondary/30 border border-border/40 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-2 backdrop-blur-md">
              <TabsTrigger 
                value="overview"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <SquaresFour weight="regular" className="w-4 h-4 hidden sm:block" />
                  <span>Overview</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="trade-analysis"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <ChartBar weight="regular" className="w-4 h-4 hidden sm:block" />
                  <span>Trades</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="strategy-analysis"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Strategy weight="regular" className="w-4 h-4 hidden sm:block" />
                  <span>Strategies</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="time-analysis"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock weight="regular" className="w-4 h-4 hidden sm:block" />
                  <span>Time</span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="ai-insights"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkle weight="fill" className="w-4 h-4 hidden sm:block" />
                  <span>Insights</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 sm:mt-6"
          >
            <TabsContent value="overview" className="mt-0 outline-none"><OverviewTab trades={filteredTrades} /></TabsContent>
            <TabsContent value="trade-analysis" className="mt-0 outline-none"><TradeAnalysisTab trades={filteredTrades} /></TabsContent>
            <TabsContent value="strategy-analysis" className="mt-0 outline-none"><StrategyAnalysisTab trades={filteredTrades} /></TabsContent>
            <TabsContent value="time-analysis" className="mt-0 outline-none"><TimeAnalysisTab trades={filteredTrades} /></TabsContent>
            <TabsContent value="ai-insights" className="mt-0 outline-none"><AIInsightsTab trades={filteredTrades} /></TabsContent>
          </motion.div>
        </Tabs>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4"><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="space-y-4 pb-6">
             <Button className="w-full glow-button text-white mt-4" onClick={() => setFilterSheetOpen(false)}>Apply Filters</Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Reports;