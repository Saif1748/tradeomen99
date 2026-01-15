import { useState, useMemo } from "react";
import { CalendarDayStats } from "@/hooks/use-calendar";
import CalendarDayCell from "./CalendarDayCell";
import DayDetailModal from "./DayDetailModal";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarGridProps {
  year: number;
  month: number;
  monthData: Map<string, CalendarDayStats> | undefined;
  colorMode: 'pnl' | 'winrate';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CalendarGrid = ({ year, month, monthData, colorMode }: CalendarGridProps) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDayStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Helper to generate YYYY-MM-DD key using local time components
  // This matches the format returned by your SQL function
  const getDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: Array<{ day: number | null; date: Date | null; isCurrentMonth: boolean }> = [];
    
    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({ 
        day, 
        date: new Date(year, month - 1, day), 
        isCurrentMonth: false 
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ 
        day, 
        date: new Date(year, month, day), 
        isCurrentMonth: true 
      });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ 
        day, 
        date: new Date(year, month + 1, day), 
        isCurrentMonth: false 
      });
    }
    
    return days;
  }, [year, month]);

  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const handleDayClick = (date: Date | null, isCurrentMonth: boolean) => {
    if (!date || !isCurrentMonth || !monthData) return;
    
    const dateKey = getDateKey(date);
    const dayData = monthData.get(dateKey);

    // Only open modal if there is data (or you can allow opening empty days if you plan to add 'Add Trade' feature later)
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
            className="text-center text-[10px] sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((dayInfo, index) => {
          // Safe data retrieval
          const data = (dayInfo.date && dayInfo.isCurrentMonth && monthData) 
            ? monthData.get(getDateKey(dayInfo.date)) || null 
            : null;

          return (
            <CalendarDayCell
              key={index}
              day={dayInfo.day}
              date={dayInfo.date}
              dayData={data}
              isCurrentMonth={dayInfo.isCurrentMonth}
              isToday={isToday(dayInfo.date)}
              colorMode={colorMode}
              onClick={() => handleDayClick(dayInfo.date, dayInfo.isCurrentMonth)}
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