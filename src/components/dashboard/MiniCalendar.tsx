import { useState, useMemo } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  startOfMonth,
  endOfMonth
} from "date-fns";
import { useCalendar } from "@/hooks/use-calendar";
import { useCurrency } from "@/hooks/use-currency";

const MiniCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✅ FIX 1: Hook returns a Record (Plain Object), not a Map
  const { data: monthData } = useCalendar(currentMonth);
  const { format: formatCurrency, symbol } = useCurrency();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigation Handlers using date-fns for safety
  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  // ✅ FIX 2: Industry Grade Date Logic (Matches CalendarGrid)
  // Generates the full 35 or 42 day grid including padding days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(endOfMonth(monthStart));

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Helper to match SQL format
  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  return (
    <div className="glass-card card-glow p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <CaretLeft weight="bold" className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <CaretRight weight="bold" className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="h-6 flex items-center justify-center text-[10px] font-light text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const dateKey = getDateKey(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, new Date());
          
          // ✅ FIX 3: Access via Object key (O(1))
          // Only show data for current month to avoid visual clutter
          const dayData = (isCurrentMonth && monthData) ? monthData[dateKey] : null;

          const hasTrading = !!(dayData && dayData.trade_count > 0);
          const isProfit = dayData ? dayData.daily_pnl > 0 : false;

          // Prepare PnL display
          let pnlDisplay = "";
          if (hasTrading && dayData) {
            const absVal = Math.abs(dayData.daily_pnl || 0);
            pnlDisplay = `${isProfit ? "+" : "-"}${symbol}${formatCurrency(absVal)}`;
          }

          return (
            <div
              key={dateKey}
              className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs transition-colors cursor-default ${
                !isCurrentMonth ? "opacity-30" : ""
              } ${isToday ? "ring-1 ring-primary" : ""} ${
                hasTrading
                  ? isProfit
                    ? "bg-emerald-400/10"
                    : "bg-rose-400/10"
                  : isCurrentMonth ? "hover:bg-secondary/20" : ""
              }`}
            >
              <span
                className={`font-normal ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {date.getDate()}
              </span>
              
              {hasTrading && isCurrentMonth && (
                <span
                  className={`text-[9px] font-light truncate w-full text-center px-0.5 ${
                    isProfit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {pnlDisplay}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;