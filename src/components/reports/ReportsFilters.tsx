import { CalendarBlank, Funnel, Export, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { DateRange } from "react-day-picker";

interface ReportsFiltersProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  instrumentFilter: string;
  setInstrumentFilter: (value: string) => void;
  strategyFilter: string;
  setStrategyFilter: (value: string) => void;
  strategies: string[];
  onExport: (format: "csv" | "pdf") => void;
}

const ReportsFilters = ({
  dateRange,
  setDateRange,
  instrumentFilter,
  setInstrumentFilter,
  strategyFilter,
  setStrategyFilter,
  strategies,
  onExport,
}: ReportsFiltersProps) => {
  
  // ✅ Improved active filter detection
  const hasActiveFilters = 
    instrumentFilter !== "all" || 
    strategyFilter !== "all" || 
    (dateRange?.from !== undefined);

  const handleReset = () => {
    setInstrumentFilter("all");
    setStrategyFilter("all");
    setDateRange(undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      
      {/* 1. Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all font-medium text-xs sm:text-sm"
          >
            <CalendarBlank weight="duotone" className="w-4 h-4 text-primary" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              "All Time"
            )}
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
            className="rounded-md border-none"
          />
        </PopoverContent>
      </Popover>


      {/* 2. Instrument Filter */}
      <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
        <SelectTrigger className="w-[150px] bg-secondary/30 border-border/50 hover:border-primary/30 transition-all text-xs sm:text-sm">
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
          <SelectItem value="OPTIONS">Options</SelectItem>
        </SelectContent>
      </Select>


      {/* 3. Strategy Filter */}
      <Select value={strategyFilter} onValueChange={setStrategyFilter}>
        <SelectTrigger className="w-[150px] bg-secondary/30 border-border/50 hover:border-primary/30 transition-all text-xs sm:text-sm">
          <SelectValue placeholder="Strategy" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all">All Strategies</SelectItem>
          {strategies.map((strategy) => (
            <SelectItem key={strategy} value={strategy}>
              {strategy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>


      {/* 4. Reset Button */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="h-9 px-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all gap-1 text-xs"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </Button>
      )}


      {/* 5. Export Section */}
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden lg:block text-[10px] uppercase font-bold text-muted-foreground tracking-widest mr-1">
          Export
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-secondary/20 border-border/50 hover:bg-primary/10 hover:text-primary transition-all h-9 font-semibold"
          onClick={() => onExport("csv")}
        >
          <Export weight="bold" className="w-3.5 h-3.5" />
          CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-secondary/20 border-border/50 hover:bg-primary/10 hover:text-primary transition-all h-9 font-semibold"
          onClick={() => onExport("pdf")}
        >
          <Export weight="bold" className="w-3.5 h-3.5" />
          PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportsFilters;