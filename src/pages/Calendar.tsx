import { useState, useMemo } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { setMonth, setYear, getMonth, getYear } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { generateMonthData, getMonthStats } from "@/lib/calendarData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [colorMode, setColorMode] = useState<'pnl' | 'winrate'>('pnl');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notes, setNotes] = useState<Map<string, string>>(new Map());

  // Generate years for the dropdown (2020 up to 2 years in future)
  const currentYearInt = new Date().getFullYear();
  const years = Array.from({ length: currentYearInt - 2020 + 3 }, (_, i) => 2020 + i);
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthData = useMemo(() => {
    const data = generateMonthData(currentDate.getFullYear(), currentDate.getMonth());
    // Merge notes into dayData
    data.forEach((dayData, key) => {
      const note = notes.get(key);
      if (note) {
        dayData.note = note;
      }
    });
    return data;
  }, [currentDate, notes]);

  const monthStats = useMemo(() => {
    return getMonthStats(monthData);
  }, [monthData]);

  const handleSaveNote = (date: Date, note: string) => {
    setNotes(prev => {
      const newNotes = new Map(prev);
      newNotes.set(date.toDateString(), note);
      return newNotes;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleMonthSelect = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setCurrentDate(setMonth(currentDate, monthIndex));
  };

  const handleYearSelect = (yearStr: string) => {
    const year = parseInt(yearStr);
    setCurrentDate(setYear(currentDate, year));
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
          {/* Calendar Header - Flex Container */}
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-4 sm:mb-6">
            
            {/* Navigation & Selectors */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full xl:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-9 w-9 rounded-lg border-border/50 hover:bg-secondary/50 shrink-0"
              >
                <CaretLeft weight="bold" className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Select
                  value={months[getMonth(currentDate)]}
                  onValueChange={handleMonthSelect}
                >
                  <SelectTrigger className="w-[120px] h-9 bg-secondary/50 border-border/50 font-medium text-sm">
                    <SelectValue>{months[getMonth(currentDate)]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-[300px]">
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={getYear(currentDate).toString()}
                  onValueChange={handleYearSelect}
                >
                  <SelectTrigger className="w-[85px] h-9 bg-secondary/50 border-border/50 font-medium text-sm">
                    <SelectValue>{getYear(currentDate)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-[300px]">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-9 w-9 rounded-lg border-border/50 hover:bg-secondary/50 shrink-0"
              >
                <CaretRight weight="bold" className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                Today
              </Button>
            </div>

            {/* Color Mode - Segmented control style */}
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setColorMode('pnl')}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
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
                  "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
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
            onSaveNote={handleSaveNote}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;