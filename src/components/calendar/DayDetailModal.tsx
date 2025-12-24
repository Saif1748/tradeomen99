import { DayData, Trade } from "@/lib/calendarData";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Smiley, 
  SmileyMeh, 
  SmileySad,
  Lightning,
  ChartLineUp,
  ChartLineDown
} from "@phosphor-icons/react";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData | null;
}

const formatPnL = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const TradeRow = ({ trade }: { trade: Trade }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        trade.direction === 'long' ? "bg-emerald-500/20" : "bg-rose-500/20"
      )}>
        {trade.direction === 'long' ? (
          <TrendUp weight="bold" className="w-4 h-4 text-emerald-400" />
        ) : (
          <TrendDown weight="bold" className="w-4 h-4 text-rose-400" />
        )}
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">{trade.symbol}</span>
        <span className="text-xs text-muted-foreground block capitalize">{trade.direction}</span>
      </div>
    </div>
    <div className="text-right">
      <span className={cn(
        "text-sm font-semibold",
        trade.pnl > 0 ? "text-emerald-400" : "text-rose-400"
      )}>
        {formatPnL(trade.pnl)}
      </span>
      <span className="text-xs text-muted-foreground block">{trade.strategy}</span>
    </div>
  </div>
);

const OverviewCard = ({ 
  title, 
  value, 
  icon, 
  className 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("p-4 rounded-xl bg-secondary/30 border border-border/50", className)}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
    <span className="text-lg font-semibold text-foreground">{value}</span>
  </div>
);

const ModalContent = ({ dayData }: { dayData: DayData }) => {
  const getEmotionIcon = () => {
    switch (dayData.emotion) {
      case 'positive':
        return <Smiley weight="fill" className="w-5 h-5 text-emerald-400" />;
      case 'negative':
        return <SmileySad weight="fill" className="w-5 h-5 text-rose-400" />;
      default:
        return <SmileyMeh weight="fill" className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getEmotionText = () => {
    switch (dayData.emotion) {
      case 'positive': return 'Positive';
      case 'negative': return 'Frustrated';
      default: return 'Neutral';
    }
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full mb-4 bg-secondary/50">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="trades" className="flex-1">Trades</TabsTrigger>
        <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <OverviewCard
            title="Total P&L"
            value={formatPnL(dayData.totalPnL)}
            icon={dayData.totalPnL >= 0 ? (
              <TrendUp weight="bold" className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendDown weight="bold" className="w-4 h-4 text-rose-400" />
            )}
          />
          <OverviewCard
            title="Win Rate"
            value={`${dayData.winRate}%`}
            icon={<Target weight="bold" className="w-4 h-4 text-primary" />}
          />
          <OverviewCard
            title="Trades"
            value={dayData.tradeCount}
            icon={<Lightning weight="bold" className="w-4 h-4 text-yellow-400" />}
          />
          <OverviewCard
            title="Emotion"
            value={getEmotionText()}
            icon={getEmotionIcon()}
          />
        </div>
      </TabsContent>

      <TabsContent value="trades" className="space-y-4">
        {/* Best & Worst Trade */}
        <div className="grid grid-cols-2 gap-3">
          {dayData.bestTrade && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ChartLineUp weight="bold" className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Best Trade</span>
              </div>
              <span className="text-sm font-semibold text-foreground block">{dayData.bestTrade.symbol}</span>
              <span className="text-lg font-bold text-emerald-400">{formatPnL(dayData.bestTrade.pnl)}</span>
            </div>
          )}
          {dayData.worstTrade && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ChartLineDown weight="bold" className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-rose-400">Worst Trade</span>
              </div>
              <span className="text-sm font-semibold text-foreground block">{dayData.worstTrade.symbol}</span>
              <span className="text-lg font-bold text-rose-400">{formatPnL(dayData.worstTrade.pnl)}</span>
            </div>
          )}
        </div>

        {/* Trade List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {dayData.trades.map(trade => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Lightning weight="fill" className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Best Strategy</span>
          </div>
          <p className="text-lg font-semibold text-primary">{dayData.bestStrategy}</p>
          <p className="text-xs text-muted-foreground mt-1">
            This strategy performed best for you on this day.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target weight="bold" className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">AI Insights</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {dayData.totalPnL > 0 
              ? "Great trading day! Your discipline and strategy execution were on point. Consider journaling what worked well."
              : "Review your entries and exits. Look for patterns in your losing trades to improve future performance."
            }
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

const DayDetailModal = ({ isOpen, onClose, dayData }: DayDetailModalProps) => {
  const isMobile = useIsMobile();

  if (!dayData) return null;

  const dateTitle = dayData.date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">
              <div className="flex items-center gap-3">
                <span className="text-foreground">{dateTitle}</span>
                <Badge variant="outline" className={cn(
                  dayData.totalPnL >= 0 ? "border-emerald-500/50 text-emerald-400" : "border-rose-500/50 text-rose-400"
                )}>
                  {formatPnL(dayData.totalPnL)}
                </Badge>
              </div>
            </SheetTitle>
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
          <DialogTitle>
            <div className="flex items-center gap-3">
              <span className="text-foreground">{dateTitle}</span>
              <Badge variant="outline" className={cn(
                dayData.totalPnL >= 0 ? "border-emerald-500/50 text-emerald-400" : "border-rose-500/50 text-rose-400"
              )}>
                {formatPnL(dayData.totalPnL)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ModalContent dayData={dayData} />
      </DialogContent>
    </Dialog>
  );
};

export default DayDetailModal;
