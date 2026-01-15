import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDayStats } from "@/hooks/use-calendar";
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Lightning, 
  Spinner,
  Crown
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
// ✅ Fix: Import from the new hook file
import { useCurrency } from "@/hooks/use-currency";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: CalendarDayStats | null;
}

// Sub-component to lazy load trades for the specific day
const DayTradesList = ({ date }: { date: string }) => {
  // ✅ Fix: Use Global Currency Hook
  const { format: formatCurrency, symbol } = useCurrency();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["day-trades", date],
    queryFn: async () => {
      // Create local start/end times for the selected date
      // We assume the date string is YYYY-MM-DD
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("trades")
        .select("id, symbol, direction, pnl, strategies(name)")
        .gte("entry_time", start.toISOString())
        .lte("entry_time", end.toISOString())
        .order("entry_time", { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  if (!trades?.length) {
    return <p className="text-center text-muted-foreground p-4 text-sm">No trades found for this day.</p>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {trades.map((trade: any) => (
        <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              trade.direction === 'LONG' ? "bg-emerald-500/20" : "bg-rose-500/20"
            )}>
              {trade.direction === 'LONG' ? (
                <TrendUp weight="bold" className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendDown weight="bold" className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
              <span className="text-xs text-muted-foreground block capitalize">{trade.direction.toLowerCase()}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-sm font-semibold",
              (trade.pnl || 0) > 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {/* ✅ Fix: Format Trade PnL */}
              {(trade.pnl || 0) >= 0 ? "+" : "-"}{symbol}{formatCurrency(Math.abs(trade.pnl || 0))}
            </span>
            <span className="text-xs text-muted-foreground block">
              {trade.strategies?.name || "No Strategy"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const OverviewCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
    <span className="text-lg font-semibold text-foreground truncate block">{value}</span>
  </div>
);

const ModalContent = ({ dayData }: { dayData: CalendarDayStats }) => {
  // ✅ Fix: Use Global Currency Hook
  const { format: formatCurrency, symbol } = useCurrency();

  // Calculate win rate on the fly
  const winRate = dayData.trade_count > 0 
    ? Math.round((dayData.win_count / dayData.trade_count) * 100) 
    : 0;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full mb-4 bg-secondary/50">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="trades" className="flex-1">Trades</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <OverviewCard
            title="Total P&L"
            // ✅ Fix: Format Total PnL
            value={`${dayData.daily_pnl >= 0 ? "+" : "-"}${symbol}${formatCurrency(Math.abs(dayData.daily_pnl))}`}
            icon={dayData.daily_pnl >= 0 ? 
              <TrendUp weight="bold" className="w-4 h-4 text-emerald-400" /> : 
              <TrendDown weight="bold" className="w-4 h-4 text-rose-400" />
            }
          />
          <OverviewCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={<Target weight="bold" className="w-4 h-4 text-primary" />}
          />
          <OverviewCard
            title="Trades"
            value={dayData.trade_count}
            icon={<Lightning weight="bold" className="w-4 h-4 text-yellow-400" />}
          />
          <OverviewCard
            title="Best Strategy"
            value={dayData.best_strategy || "N/A"}
            icon={<Crown weight="bold" className="w-4 h-4 text-purple-400" />}
          />
        </div>
      </TabsContent>

      <TabsContent value="trades">
        <DayTradesList date={dayData.trade_date} />
      </TabsContent>
    </Tabs>
  );
};

const DayDetailModal = ({ isOpen, onClose, dayData }: DayDetailModalProps) => {
  const isMobile = useIsMobile();
  // ✅ Fix: Use Global Currency Hook for Header
  const { format: formatCurrency, symbol } = useCurrency();

  if (!dayData) return null;

  // Convert "YYYY-MM-DD" string to a Date object safely for formatting
  // Appending "T00:00:00" ensures local time interpretation isn't messed up by UTC conversion
  const dateObj = new Date(dayData.trade_date + "T00:00:00");
  
  const dateTitle = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const headerContent = (
    <div className="flex items-center gap-3">
      <span className="text-foreground">{dateTitle}</span>
      <Badge variant="outline" className={cn(
        dayData.daily_pnl >= 0 ? "border-emerald-500/50 text-emerald-400" : "border-rose-500/50 text-rose-400"
      )}>
        {/* ✅ Fix: Format Header PnL */}
        {dayData.daily_pnl >= 0 ? "+" : "-"}{symbol}{formatCurrency(Math.abs(dayData.daily_pnl))}
      </Badge>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[65vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">{headerContent}</SheetTitle>
          </SheetHeader>
          <ModalContent dayData={dayData} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>{headerContent}</DialogTitle>
        </DialogHeader>
        <ModalContent dayData={dayData} />
      </DialogContent>
    </Dialog>
  );
};

export default DayDetailModal;