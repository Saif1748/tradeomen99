import { MagnifyingGlass, Funnel, CalendarBlank } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
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
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface TradesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sideFilter: string;
  setSideFilter: (side: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const TradesFilters = ({
  searchQuery,
  setSearchQuery,
  sideFilter,
  setSideFilter,
  typeFilter,
  setTypeFilter,
  dateRange,
  setDateRange,
}: TradesFiltersProps) => {
  const dateRangeLabel = dateRange?.from 
    ? dateRange.to 
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Select dates";

  return (
    <div className="glass-card p-4 rounded-2xl">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            placeholder="Search symbol, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary"
              >
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

          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-[120px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="All Sides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="LONG">Long</SelectItem>
              <SelectItem value="SHORT">Short</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[100px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Stock">Stock</SelectItem>
              <SelectItem value="Forex">Forex</SelectItem>
              <SelectItem value="Futures">Futures</SelectItem>
              <SelectItem value="Options">Options</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary"
          >
            <Funnel weight="regular" className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradesFilters;