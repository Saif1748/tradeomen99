import {
  CurrencyDollar,
  CalendarBlank,
  Bell,
  CaretDown,
  Sun,
  Moon,
  List,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ✅ Fix: Import from the new hook file, not the context file
import { useCurrency } from "@/hooks/use-currency";

interface DashboardHeaderProps {
  onMobileMenuOpen?: () => void;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
}

// ✅ Exported so TradingSection.tsx can reuse this list
export const CURRENCIES = [
  { code: "USD", label: "USD · US Dollar" },
  { code: "EUR", label: "EUR · Euro" },
  { code: "GBP", label: "GBP · British Pound" },
  { code: "JPY", label: "JPY · Japanese Yen" },
  { code: "INR", label: "INR · Indian Rupee" },
  { code: "AUD", label: "AUD · Australian Dollar" },
  { code: "CAD", label: "CAD · Canadian Dollar" },
];

const DashboardHeader = ({
  onMobileMenuOpen,
  dateRange,
  setDateRange,
}: DashboardHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { currency, symbol, setCurrency } = useCurrency();

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "All Time";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-8 pt-6 pb-2 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
        >
          <List weight="regular" className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl sm:text-2xl font-normal tracking-tight-premium text-foreground">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Currency Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-foreground">
              <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
              <span className="text-sm font-light">{currency}</span>
              <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1 bg-card border-border shadow-2xl">
            <div className="flex flex-col max-h-[300px] overflow-y-auto">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                    currency === c.code 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-secondary/60 text-muted-foreground"
                  )}
                >
                  <span>{c.label}</span>
                  {currency === c.code && <span className="text-xs">{symbol}</span>}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
              dateRange?.from 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "bg-secondary/50 border-border text-foreground hover:bg-secondary"
            )}>
              <CalendarBlank weight="regular" className="w-4 h-4" />
              <span className="text-sm font-light">{dateRangeLabel}</span>
              <CaretDown weight="bold" className="w-3 h-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border shadow-2xl" align="end">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Date Range</span>
              {setDateRange && (
                <button 
                  onClick={() => setDateRange(undefined)}
                  className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 transition-colors font-medium"
                >
                  <ArrowClockwise className="w-3 h-3" />
                  Reset to All Time
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
              className="p-3"
            />
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
        >
          {theme === "dark" ? (
            <Sun weight="regular" className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon weight="regular" className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <Bell weight="regular" className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;