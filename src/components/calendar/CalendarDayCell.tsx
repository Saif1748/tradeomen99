import { DayData } from "@/lib/calendarData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings

interface CalendarDayCellProps {
  day: number | null;
  date: Date | null;
  dayData: DayData | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  colorMode: 'pnl' | 'winrate';
  onClick: () => void;
}

const CalendarDayCell = ({
  day,
  date,
  dayData,
  isCurrentMonth,
  isToday,
  colorMode,
  onClick,
}: CalendarDayCellProps) => {
  const isMobile = useIsMobile();
  const { getCurrencySymbol } = useSettings(); // ✅ 2. Get the global symbol
  const symbol = getCurrencySymbol();

  if (day === null) {
    return <div className="aspect-[1.1] sm:aspect-[1.15] p-1 sm:p-1.5" />;
  }

  // Determine background color based on mode
  const getBgColor = () => {
    if (!dayData) return "bg-muted/10";
    
    if (colorMode === 'pnl') {
      if (dayData.totalPnL > 0) return "bg-emerald-500/10 hover:bg-emerald-500/20";
      if (dayData.totalPnL < 0) return "bg-rose-500/10 hover:bg-rose-500/20";
      return "bg-muted/10";
    } else {
      if (dayData.winRate >= 50) return "bg-emerald-500/10 hover:bg-emerald-500/20";
      if (dayData.winRate < 50 && dayData.tradeCount > 0) return "bg-rose-500/10 hover:bg-rose-500/20";
      return "bg-muted/10";
    }
  };

  // ✅ 3. Update Formatter to use dynamic symbol and compact notation
  const formatPnL = (value: number) => {
    const sign = value >= 0 ? '+' : '-';
    const absValue = Math.abs(value);
    
    if (absValue >= 1000) {
      return `${sign}${symbol}${(absValue / 1000).toFixed(1)}k`;
    }
    return `${sign}${symbol}${absValue.toFixed(0)}`;
  };

  const cellContent = (
    <div
      onClick={onClick}
      className={cn(
        "aspect-[1.1] sm:aspect-[1.15] p-1 sm:p-1.5 rounded-lg cursor-pointer transition-all duration-200",
        "border border-transparent hover:border-border/50 shadow-sm",
        getBgColor(),
        !isCurrentMonth && "opacity-20 grayscale",
        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background z-10"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn(
          "text-[10px] sm:text-sm font-medium",
          isCurrentMonth ? "text-foreground" : "text-muted-foreground"
        )}>
          {day}
        </span>
        {dayData && dayData.tradeCount > 0 && !isMobile && (
          <Badge 
            variant="secondary" 
            className="h-4 px-1 text-[9px] bg-secondary/80 text-secondary-foreground border-none"
          >
            {dayData.tradeCount}
          </Badge>
        )}
      </div>

      {dayData && (
        <div className="flex flex-col items-center justify-center mt-0.5 sm:mt-2">
          <span className={cn(
            "text-[9px] sm:text-xs font-bold leading-tight tabular-nums",
            dayData.totalPnL > 0 ? "text-emerald-500" : 
            dayData.totalPnL < 0 ? "text-rose-500" : "text-muted-foreground"
          )}>
            {formatPnL(dayData.totalPnL)}
          </span>
          {!isMobile && (
            <span className="text-[8px] sm:text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
              {dayData.winRate}% WR
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) return cellContent;
  if (!dayData) return cellContent;

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        {cellContent}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-64 p-4 glass-card border-border/50 backdrop-blur-xl shadow-2xl"
        side="top"
        align="center"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
              {dayData.tradeCount} trades
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/30 border border-border/20">
              <span className="text-[10px] text-muted-foreground block font-medium">Daily P&L</span>
              <span className={cn(
                "text-sm font-bold tabular-nums",
                dayData.totalPnL > 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {formatPnL(dayData.totalPnL)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 border border-border/20">
              <span className="text-[10px] text-muted-foreground block font-medium">Win Rate</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {dayData.winRate}%
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-secondary/30 border border-border/20">
            <span className="text-[10px] text-muted-foreground block font-medium">Top Strategy</span>
            <span className="text-xs font-semibold text-primary truncate block">
              {dayData.bestStrategy}
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CalendarDayCell;