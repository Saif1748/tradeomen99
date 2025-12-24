import {
  CurrencyDollar,
  Funnel,
  CalendarBlank,
  Bell,
  CaretDown,
} from "@phosphor-icons/react";

const DashboardHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-8 pt-6 pb-2 gap-4">
      <h1 className="text-xl sm:text-2xl font-normal tracking-tight-premium text-foreground">
        Dashboard
      </h1>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Currency Selector */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
          <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
          <span className="text-sm font-light text-foreground">USD</span>
          <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Filter */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
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
            Dec 1 - Dec 23
          </span>
          <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
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
