import { CalendarBlank, Funnel, Export, X, CaretDown } from "@phosphor-icons/react";
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
import { cn } from "@/lib/utils";

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
  
  // ✅ Active Filter Detection
  const hasActiveFilters = 
    instrumentFilter !== "all" || 
    strategyFilter !== "all" || 
    (dateRange !== undefined && dateRange?.from !== undefined); // Correctly checks if range is set

  const handleReset = () => {
    setInstrumentFilter("all");
    setStrategyFilter("all");
    setDateRange(undefined); // Reset to "All Time"
  };

  // ✅ Consistent Date Range Label Logic
  const dateRangeLabel = dateRange?.from 
    ? dateRange.to 
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "All Time";

  return (
    <div className="flex flex-wrap items-center gap-3 w-full p-1">
      
      {/* 1. Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "h-10 gap-2 px-3 font-normal transition-all duration-200",
              dateRange 
                ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                : "bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarBlank weight="duotone" className="w-4 h-4" />
            <span className="text-sm truncate max-w-[180px]">{dateRangeLabel}</span>
            <CaretDown weight="bold" className="w-3 h-3 opacity-50 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border shadow-2xl rounded-xl" align="start">
          <div className="p-3 border-b border-border flex items-center justify-between">
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Range</span>
             {dateRange && (
               <button 
                 onClick={() => setDateRange(undefined)}
                 className="text-[10px] text-rose-400 hover:text-rose-300 font-medium transition-colors"
               >
                 RESET
               </button>
             )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            className="rounded-b-xl border-none"
          />
        </PopoverContent>
      </Popover>


      {/* 2. Instrument Filter */}
      <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
        <SelectTrigger className={cn(
          "h-10 w-[160px] transition-all duration-200",
          instrumentFilter !== "all" 
            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:border-primary/30"
        )}>
          <div className="flex items-center gap-2 truncate">
            <Funnel weight={instrumentFilter !== "all" ? "fill" : "duotone"} className="w-4 h-4 shrink-0" />
            <SelectValue placeholder="Instrument" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border rounded-xl shadow-xl">
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
        <SelectTrigger className={cn(
          "h-10 w-[160px] transition-all duration-200",
          strategyFilter !== "all" 
            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:border-primary/30"
        )}>
          <div className="flex items-center gap-2 truncate">
            <SelectValue placeholder="Strategy" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border rounded-xl shadow-xl max-h-[300px]">
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
          className="h-10 px-3 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all gap-1.5 rounded-lg"
        >
          <X className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Reset</span>
        </Button>
      )}


      {/* 5. Export Section */}
      <div className="ml-auto flex items-center gap-2 pl-4 border-l border-border/30">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 bg-secondary/20 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all font-medium text-xs px-3"
          onClick={() => onExport("csv")}
        >
          <Export weight="bold" className="w-3.5 h-3.5" />
          CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 bg-secondary/20 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all font-medium text-xs px-3"
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