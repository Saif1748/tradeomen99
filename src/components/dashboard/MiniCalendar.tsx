import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { useCalendar } from "@/hooks/use-calendar";
// ✅ Fix: Import from the new hook file
import { useCurrency } from "@/hooks/use-currency";

const MiniCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Start with today

  // ✅ FIX 1: Use new hook signature (returns 'data', no notes param needed)
  const { data: monthData } = useCalendar(currentMonth);

  // Currency conversion for display
  const { format: formatUSD, symbol } = useCurrency();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // ✅ FIX 2: Helper to match SQL "YYYY-MM-DD" format
  const getDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const renderCalendarDays = () => {
    const cells: JSX.Element[] = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-12 rounded-lg" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // ✅ FIX 3: Use correct key format
      const dateKey = getDateKey(date);
      const dayData = monthData?.get(dateKey);

      // ✅ FIX 4: Use correct SQL property names (trade_count, daily_pnl)
      const hasTrading = !!(dayData && dayData.trade_count > 0);
      const isProfit = dayData ? dayData.daily_pnl > 0 : false;

      // Correct "Today" check
      const today = new Date();
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      // Prepare PnL display
      let pnlDisplay = "";
      if (hasTrading && dayData) {
        // Convert USD PnL to Selected Currency
        const absUsd = Math.abs(dayData.daily_pnl || 0);
        // formatUSD already returns a formatted string with decimals, so we just construct the sign + symbol part carefully
        // But formatUSD usually returns "1,234.56" (string). 
        // We want: "+$1.2k" or "+₹100" style depending on space. 
        // Given space is tiny, let's keep it simple or use compact notation if needed.
        // For MiniCalendar, just showing the number might be tight.
        // Let's stick to the user's snippet logic:
        pnlDisplay = `${isProfit ? "+" : "-"}${symbol}${formatUSD(absUsd)}`;
      }

      cells.push(
        <div
          key={day}
          className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs transition-colors cursor-pointer hover:bg-secondary/50 ${
            isToday ? "ring-1 ring-primary" : ""
          } ${
            hasTrading
              ? isProfit
                ? "bg-emerald-400/10"
                : "bg-rose-400/10"
              : "bg-secondary/20"
          }`}
        >
          <span
            className={`font-normal ${
              isToday ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {day}
          </span>
          {hasTrading && (
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
    }

    return cells;
  };

  return (
    <div className="glass-card card-glow p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light text-foreground">{monthName}</h3>
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
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  );
};

export default MiniCalendar;