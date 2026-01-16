import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { CalendarDayStats } from "@/hooks/use-calendar";
import CalendarDayCell from "./CalendarDayCell";
import DayDetailModal from "./DayDetailModal";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarGridProps {
  year: number;
  month: number;
  // ✅ FIX: Expect a plain object, not a Map. This matches the serialized data from the hook.
  monthData: Record<string, CalendarDayStats> | undefined;
  colorMode: 'pnl' | 'winrate';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CalendarGrid = ({ year, month, monthData, colorMode }: CalendarGridProps) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDayStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const today = new Date();

  // ✅ INDUSTRY GRADE: Robust 42-day grid generation using date-fns
  // This replaces the manual loops which can be buggy with month rollovers.
  const calendarDays = useMemo(() => {
    // 1. Find the first day of the month
    const monthStart = new Date(year, month, 1);
    
    // 2. Find the Sunday before (or on) the first day
    const startDate = startOfWeek(monthStart);
    
    // 3. Generate exactly 42 days (6 weeks) to keep the grid height stable
    // (start date + 41 days)
    const endDate = endOfWeek(new Date(startDate.getTime() + 41 * 24 * 60 * 60 * 1000));

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [year, month]);

  // Helper to ensure keys match SQL format (YYYY-MM-DD)
  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const handleDayClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth || !monthData) return;
    
    const dateKey = getDateKey(date);
    // ✅ FIX: Access property directly (O(1) lookup) instead of .get()
    const dayData = monthData[dateKey];

    if (dayData) {
      setSelectedDay(dayData);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {(isMobile ? WEEKDAYS_SHORT : WEEKDAYS).map((day, index) => (
          <div
            key={index}
            className="text-center text-[10px] sm:text-sm font-medium text-muted-foreground py-1 sm:py-2 select-none"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, new Date(year, month, 1));
          const dateKey = getDateKey(date);
          
          // ✅ FIX: Safe Object Access
          // We only look up data if it's the current month
          const data = (isCurrentMonth && monthData) 
            ? monthData[dateKey] || null 
            : null;

          return (
            <CalendarDayCell
              key={dateKey} // Using date string as key is better for React diffing
              day={date.getDate()}
              date={date}
              dayData={data}
              isCurrentMonth={isCurrentMonth}
              isToday={isSameDay(date, today)}
              colorMode={colorMode}
              onClick={() => handleDayClick(date, isCurrentMonth)}
            />
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayData={selectedDay}
      />
    </>
  );
};

export default CalendarGrid;