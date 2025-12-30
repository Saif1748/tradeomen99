import {
  ArrowUp,
  ArrowDown,
  Warning,
  Target,
  ChartLineUp,
  CurrencyDollar,
  Clock,
  X,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade } from "@/lib/tradesData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const TradeDetailContent = ({
  trade,
  onEdit,
  onDelete,
  onClose,
}: {
  trade: Trade;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onClose: () => void;
}) => {
  const rrRatio = trade.stopLoss
    ? Math.abs((trade.target - trade.entryPrice) / (trade.entryPrice - trade.stopLoss))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-medium text-foreground">{trade.symbol}</h2>
            <Badge
              variant="outline"
              className={`${
                trade.side === "LONG"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-400"
              }`}
            >
              {trade.side}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {format(trade.date, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(trade)}
          >
            <PencilSimple weight="regular" className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-rose-400"
            onClick={() => onDelete(trade)}
          >
            <Trash weight="regular" className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X weight="regular" className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* P&L Display */}
      <div className="text-right">
        <p
          className={`text-3xl font-medium tracking-tight-premium ${
            trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {trade.pnl >= 0 ? "+" : ""}$
          {Math.abs(trade.pnl).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Price Levels Card */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ArrowUp weight="regular" className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-muted-foreground">Entry</span>
          </div>
          <span className="font-medium text-foreground">
            ${trade.entryPrice.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <ArrowDown weight="regular" className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-muted-foreground">Exit</span>
          </div>
          <span className="font-medium text-foreground">
            ${trade.exitPrice.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Warning weight="regular" className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-muted-foreground">Stop Loss</span>
          </div>
          <span className="font-medium text-foreground">
            ${trade.stopLoss.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target weight="regular" className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Target</span>
          </div>
          <span className="font-medium text-foreground">
            ${trade.target.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground">R : R</span>
          </div>
          <span className="font-medium text-foreground">1 : {rrRatio.toFixed(1)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Risk</span>
          </div>
          <span className="font-medium text-foreground">
            ${trade.risk.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Quantity</span>
          </div>
          <span className="font-medium text-foreground">{trade.quantity}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock weight="regular" className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground">Hold Time</span>
          </div>
          <span className="font-medium text-foreground">{trade.holdTime}</span>
        </div>
      </div>

      {/* Notes */}
      {trade.notes && (
        <div className="glass-card p-4 rounded-xl">
          <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
          <p className="text-sm text-muted-foreground">{trade.notes}</p>
        </div>
      )}

      {/* Tags */}
      {trade.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trade.tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="border-border/50 bg-secondary/50 text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const TradeDetailSheet = ({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TradeDetailSheetProps) => {
  const isMobile = useIsMobile();

  if (!trade) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Trade Details</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full pb-6">
            <TradeDetailContent
              trade={trade}
              onEdit={onEdit}
              onDelete={onDelete}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader className="sr-only">
          <DialogTitle>Trade Details</DialogTitle>
        </DialogHeader>
        <TradeDetailContent
          trade={trade}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TradeDetailSheet;
