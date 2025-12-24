import { useState, useMemo } from "react";
import { CalendarBlank, CaretLeft, CaretRight, Fire, ChartPie } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { generateMonthData, getMonthStats } from "@/lib/calendarData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [colorMode, setColorMode] = useState<'pnl' | 'winrate'>('pnl');

  const monthData = useMemo(() => {
    return generateMonthData(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const monthStats = useMemo(() => {
    return getMonthStats(monthData);
  }, [monthData]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <CalendarBlank weight="duotone" className="w-7 h-7 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Calendar
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your trading performance over time with our heatmap visualization.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-6">
        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-5 rounded-2xl">
            <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Monthly P&L</span>
            <span className={cn(
              "text-xl sm:text-2xl font-semibold",
              monthStats.monthlyPnL >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatPnL(monthStats.monthlyPnL)}
            </span>
          </div>
          <div className="glass-card p-4 sm:p-5 rounded-2xl">
            <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Win Rate</span>
            <span className="text-xl sm:text-2xl font-semibold text-foreground">
              {monthStats.winRate}%
            </span>
          </div>
          <div className="glass-card p-4 sm:p-5 rounded-2xl">
            <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Total Trades</span>
            <span className="text-xl sm:text-2xl font-semibold text-foreground">
              {monthStats.totalTrades}
            </span>
          </div>
          <div className="glass-card p-4 sm:p-5 rounded-2xl">
            <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Trading Days</span>
            <span className="text-xl sm:text-2xl font-semibold text-foreground">
              {monthStats.tradingDays}
            </span>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-9 w-9 rounded-lg border-border/50 hover:bg-secondary/50"
              >
                <CaretLeft weight="bold" className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-9 w-9 rounded-lg border-border/50 hover:bg-secondary/50"
              >
                <CaretRight weight="bold" className="w-4 h-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground ml-2">
                {monthName}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Today
              </Button>
            </div>

            {/* Color Mode Selector & Legend */}
            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
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

              {/* Color Mode Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Color by:</span>
                <Select value={colorMode} onValueChange={(value: 'pnl' | 'winrate') => setColorMode(value)}>
                  <SelectTrigger className="w-[130px] h-9 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="pnl">
                      <div className="flex items-center gap-2">
                        <Fire weight="fill" className="w-4 h-4 text-orange-400" />
                        <span>P&L Heat</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="winrate">
                      <div className="flex items-center gap-2">
                        <ChartPie weight="fill" className="w-4 h-4 text-primary" />
                        <span>Win Rate</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
