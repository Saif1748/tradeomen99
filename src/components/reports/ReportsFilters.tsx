import { CalendarBlank, Funnel, Export } from "@phosphor-icons/react";
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
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-secondary/50 border-border">
            <CalendarBlank weight="regular" className="w-4 h-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              "Select dates"
            )}
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
          {strategies.map(strategy => (
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
          onClick={() => onExport("csv")}
        >
          <Export weight="regular" className="w-4 h-4" />
          CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-secondary/50 border-border"
          onClick={() => onExport("pdf")}
        >
          <Export weight="regular" className="w-4 h-4" />
          PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportsFilters;
