import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

const tradingDays: Record<number, { pnl: number; trades: number }> = {
  7: { pnl: 628, trades: 2 },
  8: { pnl: -120, trades: 1 },
  12: { pnl: 340, trades: 3 },
  15: { pnl: 890, trades: 4 },
  18: { pnl: -45, trades: 1 },
  20: { pnl: 156, trades: 2 },
  22: { pnl: -85, trades: 1 },
  23: { pnl: 248, trades: 1 },
};

const MiniCalendar = () => {
  const [currentMonth] = useState(new Date(2024, 11)); // December 2024
  const daysInMonth = new Date(2024, 12, 0).getDate();
  const firstDayOfMonth = new Date(2024, 11, 1).getDay();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const renderCalendarDays = () => {
    const cells = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(
        <div key={`empty-${i}`} className="h-12 rounded-lg" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const tradingData = tradingDays[day];
      const hasTrading = !!tradingData;
      const isProfit = tradingData?.pnl > 0;
      const isLoss = tradingData?.pnl < 0;
      const isToday = day === 23;

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
              className={`text-[9px] font-light ${
                isProfit ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isProfit ? "+" : ""}${Math.abs(tradingData.pnl)}
            </span>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="glass-card p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light text-foreground">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <CaretLeft
              weight="bold"
              className="w-3.5 h-3.5 text-muted-foreground"
            />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <CaretRight
              weight="bold"
              className="w-3.5 h-3.5 text-muted-foreground"
            />
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
