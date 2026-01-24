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
  Tag,
  Note,
  Image,
  ArrowRight,
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade, computeTradeData, ComputedTradeData } from "@/lib/tradesData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  allTrades?: Trade[];
}

const TradeDetailSheet = ({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allTrades = [],
}: TradeDetailSheetProps) => {
  if (!trade) return null;

  const computed = computeTradeData(trade);
  
  const rrRatio = trade.stopLoss
    ? Math.abs((trade.target - computed.avgEntryPrice) / (computed.avgEntryPrice - trade.stopLoss))
    : 0;

  // Find related trades (same symbol, different trade)
  const relatedTrades = allTrades
    .filter((t) => t.symbol === trade.symbol && t.id !== trade.id)
    .slice(0, 3);

  // Sort executions by datetime
  const sortedExecutions = [...trade.executions].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[460px] p-0 border-l border-border/50 bg-card"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Trade Details</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-medium text-foreground">{trade.symbol}</h2>
                  <Badge
                    variant="outline"
                    className={`${
                      computed.direction === "LONG"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {computed.direction}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${
                      computed.status === "closed"
                        ? "border-border/50 bg-secondary/50 text-muted-foreground"
                        : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {computed.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {format(computed.firstExecutionDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={() => onEdit(trade)}
                >
                  <PencilSimple weight="regular" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-rose-400 h-8 w-8"
                  onClick={() => onDelete(trade)}
                >
                  <Trash weight="regular" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X weight="regular" className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* P&L Display */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-right"
            >
              <p
                className={`text-4xl font-medium tracking-tight ${
                  computed.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {computed.pnl >= 0 ? "+" : ""}$
                {Math.abs(computed.pnl).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className={`text-sm mt-1 ${
                computed.rMultiple >= 0 ? "text-emerald-400/70" : "text-rose-400/70"
              }`}>
                {computed.rMultiple >= 0 ? "+" : ""}{computed.rMultiple.toFixed(2)}R
              </p>
            </motion.div>

            {/* Executions Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock weight="regular" className="w-4 h-4 text-muted-foreground" />
                Executions ({trade.executions.length})
              </h4>
              <div className="space-y-2">
                {sortedExecutions.map((exec, index) => (
                  <motion.div
                    key={exec.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
                  >
                    {/* Side indicator */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      exec.side === "BUY" 
                        ? "bg-emerald-500/20" 
                        : "bg-rose-500/20"
                    }`}>
                      {exec.side === "BUY" ? (
                        <TrendUp weight="bold" className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendDown weight="bold" className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    
                    {/* Execution details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${
                          exec.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {exec.side}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          ${exec.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(exec.datetime), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {exec.quantity} units • ${exec.fee.toFixed(2)} fee
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Price Levels Card */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 divide-y divide-border/30">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <ArrowUp weight="regular" className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-muted-foreground text-sm">Avg Entry</span>
                </div>
                <span className="font-medium text-foreground">
                  ${computed.avgEntryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {computed.status === "closed" && (
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10">
                      <ArrowDown weight="regular" className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-muted-foreground text-sm">Avg Exit</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${computed.avgExitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Warning weight="regular" className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-muted-foreground text-sm">Stop Loss</span>
                </div>
                <span className="font-medium text-foreground">
                  {trade.stopLoss > 0 ? `$${trade.stopLoss.toLocaleString()}` : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Target</span>
                </div>
                <span className="font-medium text-foreground">
                  {trade.target > 0 ? `$${trade.target.toLocaleString()}` : "-"}
                </span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 divide-y divide-border/30">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">R : R</span>
                </div>
                <span className="font-medium text-foreground">1 : {rrRatio.toFixed(1)}</span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Risk</span>
                </div>
                <span className="font-medium text-foreground">
                  ${computed.risk.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Quantity</span>
                </div>
                <span className="font-medium text-foreground">{computed.totalQuantity}</span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Hold Time</span>
                </div>
                <span className="font-medium text-foreground">{computed.holdTime}</span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Fees</span>
                </div>
                <span className="font-medium text-foreground">
                  ${computed.totalFees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Trade Notes */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Note weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Trade Notes</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {trade.notes || "No notes added."}
              </p>
            </div>

            {/* Screenshots */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Image weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Screenshots</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {trade.screenshots.length > 0 
                  ? `${trade.screenshots.length} screenshot(s) attached` 
                  : "No screenshots attached."}
              </p>
            </div>

            {/* Strategy & Tags */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Strategy & Tags</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-border/50 bg-secondary/50 text-foreground"
                >
                  {trade.strategy}
                </Badge>
                {trade.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Related Trades */}
            {relatedTrades.length > 0 && (
              <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Related Trades ({trade.symbol})
                  </h4>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-auto p-0">
                    View All <ArrowRight weight="regular" className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {relatedTrades.map((relatedTrade) => {
                    const relatedComputed = computeTradeData(relatedTrade);
                    return (
                      <div
                        key={relatedTrade.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              relatedComputed.direction === "LONG"
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {relatedComputed.direction}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(relatedComputed.firstExecutionDate, "MMM d")}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            relatedComputed.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {relatedComputed.pnl >= 0 ? "+" : ""}$
                          {Math.abs(relatedComputed.pnl).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TradeDetailSheet;
