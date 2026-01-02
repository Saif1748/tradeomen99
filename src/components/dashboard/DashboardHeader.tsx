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

interface DashboardHeaderProps {
  onMobileMenuOpen?: () => void;
}

const DashboardHeader = ({ onMobileMenuOpen }: DashboardHeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-8 pt-6 pb-2 gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
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
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
          <span className="text-sm font-light text-foreground">USD</span>
          <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Filter */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <Funnel weight="regular" className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-light text-foreground">Filters</span>
          <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Date Filter */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <CalendarBlank
            weight="regular"
            className="w-4 h-4 text-muted-foreground"
          />
          <span className="text-sm font-light text-foreground">
            <span className="hidden sm:inline">Dec 1 - Dec 23</span>
            <span className="sm:hidden">Date</span>
          </span>
          <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
        </button>

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
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
