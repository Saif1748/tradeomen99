import { useState } from "react";
import { 
  ChartLine, 
  Funnel, 
  Export, 
  CalendarBlank, 
  SquaresFour, 
  ChartBar, 
  Strategy, 
  Clock, 
  Sparkle, 
  X
} from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Components
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import MobileSidebar from "@/components/dashboard/MobileSidebar"; // ✅ Added missing import
import OverviewTab from "@/components/reports/OverviewTab";
import TradeAnalysisTab from "@/components/reports/TradeAnalysisTab";
import StrategyAnalysisTab from "@/components/reports/StrategyAnalysisTab";
import TimeAnalysisTab from "@/components/reports/TimeAnalysisTab";
import AIInsightsTab from "@/components/reports/AIInsightsTab";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

// Hooks
import { useReports, ReportTab } from "@/hooks/use-reports";
import { useStrategies } from "@/hooks/use-strategies";
import { useCurrency } from "@/hooks/use-currency";

const Reports = () => {
  // --- 1. State Management ---
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1),
    to: new Date(),
  });
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");
  
  // Filters Sheet State
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  // ✅ FIX: Mobile Sidebar State (Was missing in previous version)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hook Initialization
  const { symbol, format: formatCurrency } = useCurrency();
  const { strategyNames } = useStrategies();

  // Reports Data Fetching
  const { data, isLoading, isError } = useReports(activeTab, {
    instrument: instrumentFilter,
    strategy: strategyFilter,
    from: dateRange?.from,
    to: dateRange?.to
  });

  // --- UI Helpers ---
  const activeFilterCount = (instrumentFilter !== "all" ? 1 : 0) + (strategyFilter !== "all" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const dateRangeLabel = dateRange?.from 
    ? dateRange.to 
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Select dates";

  const handleExport = (type: "csv" | "pdf") => toast.success(`Exporting ${type}...`);
  
  const clearFilters = () => { 
    setInstrumentFilter("all"); 
    setStrategyFilter("all"); 
    setDateRange(undefined);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        icon={<ChartLine weight="duotone" className="w-6 h-6 text-primary" />}
        // ✅ FIX: Wire up the mobile menu trigger
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      {/* ✅ FIX: Add Mobile Sidebar Component */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        
        {/* Filters Bar - Desktop */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-secondary/30 border-border hover:border-primary/30 transition-all font-medium text-sm">
                <CalendarBlank weight="duotone" className="w-4 h-4 text-primary" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border shadow-2xl" align="start">
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
            <SelectTrigger className="w-[150px] bg-secondary/30 border-border hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2">
                <Funnel weight="duotone" className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Instrument" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Instruments</SelectItem>
              <SelectItem value="CRYPTO">Crypto</SelectItem>
              <SelectItem value="STOCK">Equity</SelectItem>
              <SelectItem value="FOREX">Forex</SelectItem>
              <SelectItem value="FUTURES">Futures</SelectItem>
            </SelectContent>
          </Select>

          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="w-[150px] bg-secondary/30 border-border hover:border-primary/30 transition-all">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Strategies</SelectItem>
              {strategyNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-rose-400 h-9 px-2 gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button onClick={() => handleExport("csv")} variant="outline" size="sm" className="gap-2 bg-secondary/20 border-border/50 h-9 font-semibold">
              <Export weight="bold" className="w-3.5 h-3.5" />
              CSV
            </Button>
            <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" className="gap-2 bg-secondary/20 border-border/50 h-9 font-semibold">
              <Export weight="bold" className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>

        {/* Mobile Filters Trigger */}
        <div className="sm:hidden flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 justify-start gap-2 bg-secondary/30 border-border/50 text-[10px] h-9"
              >
                <CalendarBlank weight="duotone" className="w-3.5 h-3.5 text-primary" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterSheetOpen(true)}
            className={`gap-1.5 bg-secondary/30 border-border/50 h-9 ${hasActiveFilters ? 'text-primary border-primary/50' : ''}`}
          >
            <Funnel weight={hasActiveFilters ? "fill" : "duotone"} className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Tabs System */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as ReportTab)} className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
            <TabsList className="w-full h-auto p-1.5 bg-secondary/30 border border-border/40 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-2 backdrop-blur-md">
              <TabsTrigger 
                value="overview"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <SquaresFour weight="duotone" className="w-4 h-4 hidden sm:block" />
                  <span>Overview</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analysis"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <ChartBar weight="duotone" className="w-4 h-4 hidden sm:block" />
                  <span>Trades</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="strategy"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Strategy weight="duotone" className="w-4 h-4 hidden sm:block" />
                  <span>Strategies</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="time"
                className="group relative rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock weight="duotone" className="w-4 h-4 hidden sm:block" />
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
            {/* Note: data passed here is potentially cached via TanStack Query.
              Each component below should handle 'isLoading' gracefullly.
            */}
            <TabsContent value="overview" className="mt-0 outline-none">
              <OverviewTab data={data} isLoading={isLoading} isError={isError} />
            </TabsContent>
            <TabsContent value="analysis" className="mt-0 outline-none">
              <TradeAnalysisTab data={data} isLoading={isLoading} isError={isError} />
            </TabsContent>
            <TabsContent value="strategy" className="mt-0 outline-none">
              <StrategyAnalysisTab data={data} isLoading={isLoading} isError={isError} />
            </TabsContent>
            <TabsContent value="time" className="mt-0 outline-none">
              <TimeAnalysisTab data={data} isLoading={isLoading} isError={isError} />
            </TabsContent>
            <TabsContent value="ai-insights" className="mt-0 outline-none">
              <AIInsightsTab data={data} isLoading={isLoading} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4 border-b border-border/50">
            <SheetTitle className="text-left">Filter Analytics</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Instrument</label>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger className="w-full bg-secondary/30 border-border h-12 rounded-xl">
                  <SelectValue placeholder="Instrument" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Instruments</SelectItem>
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                  <SelectItem value="STOCK">Equity</SelectItem>
                  <SelectItem value="FOREX">Forex</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Strategy</label>
              <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                <SelectTrigger className="w-full bg-secondary/30 border-border h-12 rounded-xl">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Strategies</SelectItem>
                  {strategyNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-medium border-border" onClick={clearFilters}>Reset</Button>
              <Button className="flex-1 glow-button text-white h-12 rounded-xl font-bold bg-primary" onClick={() => setFilterSheetOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Reports;