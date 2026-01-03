import { useState, useMemo } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { generateMonthData, getMonthStats } from "@/lib/calendarData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [colorMode, setColorMode] = useState<'pnl' | 'winrate'>('pnl');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const monthData = useMemo(() => {
    return generateMonthData(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const monthStats = useMemo(() => {
    return getMonthStats(monthData);
  }, [monthData]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Calendar"
        icon={<CalendarBlank weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        {/* Monthly Stats Cards - Compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
            <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5 sm:mb-1">Monthly P&L</span>
            <span className={cn(
              "text-lg sm:text-2xl font-semibold",
              monthStats.monthlyPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatPnL(monthStats.monthlyPnL)}
            </span>
          </div>
          <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
            <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5 sm:mb-1">Win Rate</span>
            <span className="text-lg sm:text-2xl font-semibold text-foreground">
              {monthStats.winRate}%
            </span>
          </div>
          <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
            <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5 sm:mb-1">Trades</span>
            <span className="text-lg sm:text-2xl font-semibold text-foreground">
              {monthStats.totalTrades}
            </span>
          </div>
          <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
            <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5 sm:mb-1">Trading Days</span>
            <span className="text-lg sm:text-2xl font-semibold text-foreground">
              {monthStats.tradingDays}
            </span>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="glass-card p-3 sm:p-6 rounded-xl sm:rounded-2xl">
          {/* Calendar Header - Compact on mobile */}
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
            {/* Navigation - Compact */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border-border/50 hover:bg-secondary/50"
              >
                <CaretLeft weight="bold" className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border-border/50 hover:bg-secondary/50"
              >
                <CaretRight weight="bold" className="w-4 h-4" />
              </Button>
              <h2 className="text-base sm:text-xl font-semibold text-foreground ml-1 sm:ml-2">
                <span className="hidden sm:inline">{monthName}</span>
                <span className="sm:hidden">{shortMonthName}</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="hidden sm:inline-flex ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Today
              </Button>
            </div>

            {/* Color Mode - Segmented control style */}
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
              <button
                onClick={() => setColorMode('pnl')}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                  colorMode === 'pnl' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                P&L
              </button>
              <button
                onClick={() => setColorMode('winrate')}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                  colorMode === 'winrate' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="hidden sm:inline">Win Rate</span>
                <span className="sm:hidden">WR</span>
              </button>
            </div>
          </div>

          {/* Legend - Desktop only */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-rose-500/30" />
              <span>Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <span>No Trades</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <CalendarGrid
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            monthData={monthData}
            colorMode={colorMode}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
