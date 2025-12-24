import { DayData } from "@/lib/calendarData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";

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

  if (day === null) {
    return <div className="aspect-square p-1 sm:p-2" />;
  }

  // Determine background color based on mode
  const getBgColor = () => {
    if (!dayData) return "bg-muted/20";
    
    if (colorMode === 'pnl') {
      if (dayData.totalPnL > 0) return "bg-emerald-500/20 hover:bg-emerald-500/30";
      if (dayData.totalPnL < 0) return "bg-rose-500/20 hover:bg-rose-500/30";
      return "bg-muted/20";
    } else {
      // Win rate mode
      if (dayData.winRate >= 50) return "bg-emerald-500/20 hover:bg-emerald-500/30";
      if (dayData.winRate < 50 && dayData.tradeCount > 0) return "bg-rose-500/20 hover:bg-rose-500/30";
      return "bg-muted/20";
    }
  };

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const cellContent = (
    <div
      onClick={onClick}
      className={cn(
        "aspect-square p-1.5 sm:p-2 rounded-lg cursor-pointer transition-all duration-200",
        "border border-transparent hover:border-border/50",
        getBgColor(),
        !isCurrentMonth && "opacity-40",
        isToday && "ring-2 ring-primary/50"
      )}
    >
      {/* Top row: Date and trade count */}
      <div className="flex items-start justify-between mb-1">
        <span className={cn(
          "text-xs sm:text-sm font-medium",
          isCurrentMonth ? "text-foreground" : "text-muted-foreground"
        )}>
          {day}
        </span>
        {dayData && dayData.tradeCount > 0 && (
          <Badge 
            variant="secondary" 
            className="h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs bg-secondary/80 text-secondary-foreground"
          >
            {dayData.tradeCount}
          </Badge>
        )}
      </div>

      {/* P&L Display */}
      {dayData && (
        <div className="flex flex-col items-center justify-center mt-1 sm:mt-2">
          <span className={cn(
            "text-xs sm:text-sm font-semibold",
            dayData.totalPnL > 0 ? "text-emerald-400" : dayData.totalPnL < 0 ? "text-rose-400" : "text-muted-foreground"
          )}>
            {formatPnL(dayData.totalPnL)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
            {dayData.winRate}% WR
          </span>
        </div>
      )}
    </div>
  );

  // On mobile, just return the cell without hover card
  if (isMobile) {
    return cellContent;
  }

  // On desktop, wrap with HoverCard
  if (!dayData) {
    return cellContent;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {cellContent}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-64 p-4 bg-card border-border"
        side="top"
        align="center"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {date?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <Badge variant="outline" className="text-xs">
              {dayData.tradeCount} trades
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/50">
              <span className="text-[10px] text-muted-foreground block">P&L</span>
              <span className={cn(
                "text-sm font-semibold",
                dayData.totalPnL > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {formatPnL(dayData.totalPnL)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <span className="text-[10px] text-muted-foreground block">Win Rate</span>
              <span className="text-sm font-semibold text-foreground">
                {dayData.winRate}%
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-secondary/50">
            <span className="text-[10px] text-muted-foreground block">Best Strategy</span>
            <span className="text-sm font-medium text-primary">
              {dayData.bestStrategy}
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CalendarDayCell;
