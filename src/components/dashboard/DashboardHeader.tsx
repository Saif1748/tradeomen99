import {
  CurrencyDollar,
  Funnel,
  CalendarBlank,
  Bell,
  CaretDown,
  Sun,
  Moon,
  List,
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
import { useCurrency } from "@/contexts/CurrencyContext";

interface DashboardHeaderProps {
  onMobileMenuOpen?: () => void;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
}

const CURRENCIES = [
  { code: "USD", label: "USD · US Dollar" },
  { code: "INR", label: "INR · Indian Rupee" },
  { code: "EUR", label: "EUR · Euro" },
  { code: "GBP", label: "GBP · British Pound" },
  { code: "JPY", label: "JPY · Japanese Yen" },
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
      ? `${format(dateRange.from, "MMM d")} - ${format(
          dateRange.to,
          "MMM d"
        )}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Select dates";

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
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
              <CurrencyDollar
                weight="regular"
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm font-light text-foreground">
                {currency}
              </span>
              <CaretDown
                weight="bold"
                className="w-3 h-3 text-muted-foreground"
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-52 p-1 bg-card border-border"
          >
            <div className="flex flex-col">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      currency === c.code
                        ? "bg-secondary text-foreground"
                        : "hover:bg-secondary/60 text-muted-foreground"
                    }
                  `}
                >
                  <span>{c.label}</span>
                  {currency === c.code && (
                    <span className="text-xs text-primary">{symbol}</span>
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter (Mock) */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <Funnel
            weight="regular"
            className="w-4 h-4 text-muted-foreground"
          />
          <span className="text-sm font-light text-foreground">Filters</span>
          <CaretDown
            weight="bold"
            className="w-3 h-3 text-muted-foreground"
          />
        </button>

        {/* Date Filter */}
        {setDateRange ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                <CalendarBlank
                  weight="regular"
                  className="w-4 h-4 text-muted-foreground"
                />
                <span className="text-sm font-light text-foreground">
                  {dateRangeLabel}
                </span>
                <CaretDown
                  weight="bold"
                  className="w-3 h-3 text-muted-foreground"
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-card border-border"
              align="end"
            >
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
        ) : (
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
            <CalendarBlank
              weight="regular"
              className="w-4 h-4 text-muted-foreground"
            />
            <span className="text-sm font-light text-foreground">
              Date Range
            </span>
            <CaretDown
              weight="bold"
              className="w-3 h-3 text-muted-foreground"
            />
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
        >
          {theme === "dark" ? (
            <Sun
              weight="regular"
              className="w-5 h-5 text-muted-foreground"
            />
          ) : (
            <Moon
              weight="regular"
              className="w-5 h-5 text-muted-foreground"
            />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <Bell
            weight="regular"
            className="w-5 h-5 text-muted-foreground"
          />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
