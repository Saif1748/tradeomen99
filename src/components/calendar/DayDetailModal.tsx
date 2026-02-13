import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ Import Settings
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Smiley, 
  SmileyMeh, 
  SmileySad, 
  Lightning, 
  ChartLineUp, 
  ChartLineDown, 
  NotePencil, 
  FloppyDisk, 
  X 
} from "@phosphor-icons/react";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData | null;
  onSaveNote?: (date: Date, note: string) => void;
}

// ✅ TradeRow now accepts a simple formatter function
const TradeRow = ({ trade, formatValue }: { trade: Trade; formatValue: (val: number) => string }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-primary/20 transition-colors">
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        trade.direction === 'long' ? "bg-emerald-500/10" : "bg-rose-500/10"
      )}>
        {trade.direction === 'long' ? (
          <TrendUp weight="bold" className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendDown weight="bold" className="w-4 h-4 text-rose-500" />
        )}
      </div>
      <div>
        <span className="text-sm font-semibold text-foreground uppercase tracking-tight">{trade.symbol}</span>
        <span className="text-[10px] text-muted-foreground block capitalize font-medium">{trade.direction}</span>
      </div>
    </div>
    <div className="text-right">
      <span className={cn(
        "text-sm font-bold tabular-nums",
        trade.pnl > 0 ? "text-emerald-500" : "text-rose-500"
      )}>
        {formatValue(trade.pnl)}
      </span>
      <span className="text-[10px] text-muted-foreground block font-medium">{trade.strategy}</span>
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
  <div className={cn("p-4 rounded-2xl bg-secondary/20 border border-border/40 backdrop-blur-sm", className)}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
    <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
  </div>
);

const ModalContent = ({ 
  dayData, 
  onSaveNote,
  formatValue 
}: { 
  dayData: DayData; 
  onSaveNote?: (date: Date, note: string) => void;
  formatValue: (val: number) => string;
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(dayData.note || "");

  useEffect(() => {
    setNoteText(dayData.note || "");
  }, [dayData.note]);

  const getEmotionIcon = () => {
    switch (dayData.emotion) {
      case 'positive': return <Smiley weight="fill" className="w-5 h-5 text-emerald-500" />;
      case 'negative': return <SmileySad weight="fill" className="w-5 h-5 text-rose-500" />;
      default: return <SmileyMeh weight="fill" className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getEmotionText = () => {
    switch (dayData.emotion) {
      case 'positive': return 'Positive';
      case 'negative': return 'Frustrated';
      default: return 'Neutral';
    }
  };

  const handleSaveNote = () => {
    onSaveNote?.(dayData.date, noteText);
    setIsEditingNote(false);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full mb-6 bg-secondary/40 p-1 rounded-xl">
        <TabsTrigger value="overview" className="flex-1 rounded-lg text-xs font-semibold">Overview</TabsTrigger>
        <TabsTrigger value="trades" className="flex-1 rounded-lg text-xs font-semibold">Trades</TabsTrigger>
        <TabsTrigger value="notes" className="flex-1 rounded-lg text-xs font-semibold">Journal</TabsTrigger>
        <TabsTrigger value="insights" className="flex-1 rounded-lg text-xs font-semibold">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 outline-none">
        <div className="grid grid-cols-2 gap-3">
          <OverviewCard
            title="Total P&L"
            value={formatValue(dayData.totalPnL)}
            icon={dayData.totalPnL >= 0 ? (
              <TrendUp weight="bold" className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendDown weight="bold" className="w-4 h-4 text-rose-500" />
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
            icon={<Lightning weight="bold" className="w-4 h-4 text-yellow-500" />}
          />
          <OverviewCard
            title="Mindset"
            value={getEmotionText()}
            icon={getEmotionIcon()}
          />
        </div>
      </TabsContent>

      <TabsContent value="trades" className="space-y-4 outline-none">
        <div className="grid grid-cols-2 gap-3">
          {dayData.bestTrade && (
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <ChartLineUp weight="bold" className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Best</span>
              </div>
              <span className="text-xs font-bold text-foreground block">{dayData.bestTrade.symbol}</span>
              <span className="text-base font-black text-emerald-500 tabular-nums">
                {formatValue(dayData.bestTrade.pnl)}
              </span>
            </div>
          )}
          {dayData.worstTrade && (
            <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <ChartLineDown weight="bold" className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Worst</span>
              </div>
              <span className="text-xs font-bold text-foreground block">{dayData.worstTrade.symbol}</span>
              <span className="text-base font-black text-rose-500 tabular-nums">
                {formatValue(dayData.worstTrade.pnl)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {dayData.trades.map(trade => (
            <TradeRow key={trade.id} trade={trade} formatValue={formatValue} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="notes" className="space-y-4 outline-none">
        <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <NotePencil weight="bold" className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">Daily Journal</span>
            </div>
            {!isEditingNote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNote(true)}
                className="h-7 text-[11px] font-bold hover:bg-primary/10 hover:text-primary rounded-lg"
              >
                {noteText ? "EDIT NOTE" : "WRITE NOTE"}
              </Button>
            )}
          </div>
          
          {isEditingNote ? (
            <div className="space-y-3">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="How was your psychology today? Did you follow your rules?"
                className="min-h-[140px] bg-background/40 border-border/40 resize-none focus-visible:ring-primary/30 rounded-xl text-sm"
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNoteText(dayData.note || "");
                    setIsEditingNote(false);
                  }}
                  className="text-xs font-semibold rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-4"
                >
                  <FloppyDisk weight="bold" className="w-4 h-4 mr-2" />
                  Save Note
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {noteText || "No notes recorded. Journaling builds discipline—write something down!"}
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4 outline-none">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Lightning weight="fill" className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Top Strategy</span>
          </div>
          <p className="text-xl font-black text-foreground">{dayData.bestStrategy}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-2 font-medium leading-tight">
            Based on your execution today, this strategy yielded the highest efficiency.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/10 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Target weight="bold" className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Feedback</span>
          </div>
          <p className="text-sm text-foreground/90 font-medium leading-relaxed">
            {dayData.totalPnL > 0 
              ? "Strong performance. Your win rate suggests high quality setups. Ensure you aren't over-trading to protect these gains."
              : "A challenging day. Review your 'Worst Trade' to check if it was a strategy failure or a discipline error."
            }
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

const DayDetailModal = ({ isOpen, onClose, dayData, onSaveNote }: DayDetailModalProps) => {
  const isMobile = useIsMobile();
  const { getCurrencySymbol } = useSettings(); // ✅ 1. Get only the Symbol
  const currencySymbol = getCurrencySymbol();

  if (!dayData) return null;

  // ✅ 2. Create a "Format Only" helper (No multiplication)
  // This expects the value to ALREADY be in the correct currency unit.
  const formatValue = (val: number) => {
    const sign = val >= 0 ? "+" : "-";
    const absVal = Math.abs(val);
    return `${sign}${currencySymbol}${absVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const dateTitle = dayData.date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'long', 
    day: 'numeric' 
  });

  const headerContent = (
    <div className="flex items-center gap-3">
      <span className="text-foreground font-black tracking-tight">{dateTitle}</span>
      <Badge className={cn(
        "font-bold tabular-nums border-none shadow-sm",
        dayData.totalPnL >= 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
      )}>
        {formatValue(dayData.totalPnL)}
      </Badge>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[32px] glass-card border-t-border/50 p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left">{headerContent}</SheetTitle>
          </SheetHeader>
          <ModalContent dayData={dayData} onSaveNote={onSaveNote} formatValue={formatValue} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-card border-border/40 p-6 rounded-[24px] shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle>{headerContent}</DialogTitle>
        </DialogHeader>
        <ModalContent dayData={dayData} onSaveNote={onSaveNote} formatValue={formatValue} />
      </DialogContent>
    </Dialog>
  );
};

export default DayDetailModal;