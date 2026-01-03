import { useState, useMemo } from "react";
import { ChartLine, Funnel, Export, CalendarBlank } from "@phosphor-icons/react";
import { DateRange } from "react-day-picker";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import OverviewTab from "@/components/reports/OverviewTab";
import TradeAnalysisTab from "@/components/reports/TradeAnalysisTab";
import StrategyAnalysisTab from "@/components/reports/StrategyAnalysisTab";
import TimeAnalysisTab from "@/components/reports/TimeAnalysisTab";
import { generateMockTrades, Trade, strategies as tradeStrategies } from "@/lib/tradesData";
import { toast } from "sonner";
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
    setFilterSheetOpen(false);
  };

  const clearFilters = () => {
    setInstrumentFilter("all");
    setStrategyFilter("all");
  };

  const hasActiveFilters = instrumentFilter !== "all" || strategyFilter !== "all";

  const dateRangeLabel = dateRange?.from 
    ? dateRange.to 
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Select dates";

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        icon={<ChartLine weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        {/* Filters - Desktop */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          {/* Date Range */}
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

          {/* Instrument Filter */}
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

          {/* Strategy Filter */}
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

          {/* Export */}
          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-secondary/50 border-border"
              onClick={() => handleExport("csv")}
            >
              <Export weight="regular" className="w-4 h-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-secondary/50 border-border"
              onClick={() => handleExport("pdf")}
            >
              <Export weight="regular" className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters - Mobile: Compact bar */}
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

        {/* Tab Navigation - Sticky on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
            <TabsList className="bg-secondary/50 border border-border p-1 rounded-xl w-full grid grid-cols-4">
              <TabsTrigger 
                value="overview"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all"
              >
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trade-analysis"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all"
              >
                <span className="hidden sm:inline">Trade Analysis</span>
                <span className="sm:hidden">Trades</span>
              </TabsTrigger>
              <TabsTrigger 
                value="strategy-analysis"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all"
              >
                <span className="hidden sm:inline">Strategy Analysis</span>
                <span className="sm:hidden">Strategy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="time-analysis"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all"
              >
                <span className="hidden sm:inline">Time Analysis</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4 sm:mt-6">
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

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground">Filters</SheetTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  Clear all
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 bg-secondary/50 border-border/50">
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
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Instrument Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Instrument</label>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Instruments" />
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
            </div>

            {/* Strategy Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Strategy</label>
              <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Strategies" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Strategies</SelectItem>
                  {tradeStrategies.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export options */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-sm text-muted-foreground">Export</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 bg-secondary/50 border-border"
                  onClick={() => handleExport("csv")}
                >
                  <Export weight="regular" className="w-4 h-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 bg-secondary/50 border-border"
                  onClick={() => handleExport("pdf")}
                >
                  <Export weight="regular" className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>

            <Button 
              className="w-full glow-button text-white mt-4" 
              onClick={() => setFilterSheetOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Reports;
