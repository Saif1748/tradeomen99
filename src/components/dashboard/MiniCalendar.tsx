import { useState, useMemo } from "react";
import { CaretLeft, CaretRight, CalendarBlank, CircleNotch } from "@phosphor-icons/react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths
} from "date-fns";

import { useTrades } from "@/hooks/useTrades";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings
import { convertCurrency } from "@/services/currencyService"; // ✅ 2. Import Converter
import { cn } from "@/lib/utils";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MiniCalendar = () => {
  const { activeAccount } = useWorkspace();
  const { profile } = useUser();
  
  // ✅ 3. Get Currency Settings
  const { exchangeRate, getCurrencySymbol } = useSettings();
  const currencySymbol = getCurrencySymbol();
  
  // State: Manage current view (defaults to real-time current month)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 🔥 FETCH REAL DATA (Shared Cache)
  const { trades, isLoading } = useTrades(activeAccount?.id, profile?.uid);

  // 🔄 PROCESS DATA: Map trades to calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart); // Adjusts to Sunday start
    const endDate = endOfWeek(monthEnd);

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });

    return daysInterval.map((day) => {
      // Filter trades for this specific day
      // Handles both Firestore Timestamps and JS Dates
      const dayTrades = trades.filter(t => {
        const tradeDate = t.entryDate instanceof Date 
          ? t.entryDate 
          : (typeof t.entryDate.toDate === 'function' ? t.entryDate.toDate() : new Date(t.entryDate));
        return isSameDay(tradeDate, day);
      });

      const rawPnL = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
      
      // ✅ 4. Convert P&L to Selected Currency
      const totalPnL = convertCurrency(rawPnL, exchangeRate);
      
      const tradeCount = dayTrades.length;

      return {
        date: day,
        dayNumber: day.getDate(),
        pnl: totalPnL,
        tradeCount,
        hasTrades: tradeCount > 0,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isSameDay(day, new Date())
      };
    });
  }, [currentMonth, trades, exchangeRate]); // ✅ Added exchangeRate dependency

  // Handlers
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // ✅ 5. Update Formatter to use Dynamic Symbol
  const formatPnL = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000) return `${currencySymbol}${(absVal / 1000).toFixed(1)}k`;
    return `${currencySymbol}${absVal.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="glass-card card-glow p-5 rounded-2xl h-full flex items-center justify-center min-h-[300px]">
        <CircleNotch className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card card-glow p-5 rounded-2xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <CaretLeft weight="bold" className="w-4 h-4 text-muted-foreground" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <CaretRight weight="bold" className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground ml-2">
            {format(currentMonth, "MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((dayData, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square rounded-lg p-1 flex flex-col items-center justify-center transition-colors relative",
              // Styling logic:
              !dayData.isCurrentMonth 
                ? "opacity-20 hover:bg-secondary/30" // Dim days from other months
                : dayData.hasTrades
                  ? dayData.pnl >= 0
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  : "hover:bg-secondary/50 text-muted-foreground",
              dayData.isToday && "ring-1 ring-primary z-10"
            )}
          >
            {/* Day Number */}
            <span className={cn(
              "text-xs font-medium",
              dayData.isToday && "text-primary font-bold"
            )}>
              {dayData.dayNumber}
            </span>

            {/* PnL Display (Only if has trades) */}
            {dayData.hasTrades && (
              <span className="text-[8px] font-bold mt-0.5">
                {dayData.pnl >= 0 ? "+" : "-"}{formatPnL(dayData.pnl)}
              </span>
            )}

            {/* Trade Count Icon (Only if has trades) */}
            {dayData.hasTrades && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <CalendarBlank weight="fill" className="w-2 h-2 opacity-70" />
                <span className="text-[8px] opacity-90 font-medium">
                  {dayData.tradeCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};