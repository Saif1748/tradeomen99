import { CalendarDayStats } from "@/hooks/use-calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";
// ✅ Fix: Import from the new hook file
import { useCurrency } from "@/hooks/use-currency";

interface CalendarDayCellProps {
  day: number | null;
  date: Date | null;
  dayData: CalendarDayStats | null;
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
  
  // ✅ Fix: Use Global Currency Hook
  const { format: formatCurrency, symbol } = useCurrency();

  // ✅ Calculate winRate derived from efficient SQL stats
  const winRate = dayData && dayData.trade_count > 0 
    ? Math.round((dayData.win_count / dayData.trade_count) * 100) 
    : 0;

  if (day === null) {
    return <div className="aspect-[1.1] sm:aspect-[1.15] p-1 sm:p-1.5" />;
  }

  // Determine background color based on mode
  const getBgColor = () => {
    if (!dayData) return "bg-muted/20";
    
    if (colorMode === 'pnl') {
      if (dayData.daily_pnl > 0) return "bg-emerald-500/20 hover:bg-emerald-500/30";
      if (dayData.daily_pnl < 0) return "bg-rose-500/20 hover:bg-rose-500/30";
      return "bg-muted/20";
    } else {
      // Win rate mode
      if (winRate >= 50) return "bg-emerald-500/20 hover:bg-emerald-500/30";
      if (winRate < 50 && dayData.trade_count > 0) return "bg-rose-500/20 hover:bg-rose-500/30";
      return "bg-muted/20";
    }
  };

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? '+' : '-';
    
    // Get the converted string (e.g. "1,200.50")
    // We assume the hook uses en-US formatting (commas for thousands)
    const formattedStr = formatCurrency(Math.abs(value)); 
    
    // Parse back to number to determine magnitude in the TARGET currency
    const convertedValue = parseFloat(formattedStr.replace(/,/g, ''));

    // Apply abbreviation logic based on the converted value
    if (convertedValue >= 1000) {
      return `${sign}${symbol}${(convertedValue / 1000).toFixed(1)}k`;
    }
    return `${sign}${symbol}${convertedValue.toFixed(0)}`;
  };

  const cellContent = (
    <div
      onClick={onClick}
      className={cn(
        "aspect-[1.1] sm:aspect-[1.15] p-1 sm:p-1.5 rounded-lg cursor-pointer transition-all duration-200",
        "border border-transparent hover:border-border/50",
        getBgColor(),
        !isCurrentMonth && "opacity-40",
        isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}
    >
      {/* Top row: Date and trade count */}
      <div className="flex items-start justify-between">
        <span className={cn(
          "text-xs sm:text-sm font-medium",
          isCurrentMonth ? "text-foreground" : "text-muted-foreground"
        )}>
          {day}
        </span>
        {/* Trade count badge - desktop only */}
        {dayData && dayData.trade_count > 0 && !isMobile && (
          <Badge 
            variant="secondary" 
            className="h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs bg-secondary/80 text-secondary-foreground"
          >
            {dayData.trade_count}
          </Badge>
        )}
      </div>

      {/* P&L Display - Mobile shows only P&L, desktop shows both */}
      {dayData && (
        <div className="flex flex-col items-center justify-center mt-0.5 sm:mt-2">
          <span className={cn(
            "text-[10px] sm:text-sm font-semibold leading-tight",
            dayData.daily_pnl > 0 ? "text-emerald-600 dark:text-emerald-400" : 
            dayData.daily_pnl < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
          )}>
            {formatPnL(dayData.daily_pnl)}
          </span>
          {/* Win rate - desktop only */}
          {!isMobile && (
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
              {winRate}% WR
            </span>
          )}
        </div>
      )}

      {/* Empty day hint for mobile */}
      {!dayData && isCurrentMonth && isMobile && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/50">-</span>
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
              {dayData.trade_count} trades
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/50">
              <span className="text-[10px] text-muted-foreground block">P&L</span>
              <span className={cn(
                "text-sm font-semibold",
                dayData.daily_pnl > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {formatPnL(dayData.daily_pnl)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <span className="text-[10px] text-muted-foreground block">Win Rate</span>
              <span className="text-sm font-semibold text-foreground">
                {winRate}%
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-secondary/50">
            <span className="text-[10px] text-muted-foreground block">Best Strategy</span>
            <span className="text-sm font-medium text-primary">
              {dayData.best_strategy || "N/A"}
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CalendarDayCell;