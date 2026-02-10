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
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade } from "@/types/trade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

const TradeDetailSheet = ({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TradeDetailSheetProps) => {
  if (!trade) return null;

  // Safe Math: Handle optional/missing fields defensively
  const avgEntry = trade.avgEntryPrice || 0;
  const avgExit = trade.avgExitPrice || 0;
  const stopLoss = trade.initialStopLoss || 0;
  const target = trade.takeProfitTarget || 0;
  const pnl = trade.netPnl || 0;
  
  // Calculate R-Multiple: (Reward / Risk)
  let rMultiple = 0;
  if (stopLoss > 0 && avgEntry > 0) {
      const riskPerShare = Math.abs(avgEntry - stopLoss);
      const rewardPerShare = Math.abs((avgExit || trade.entryPrice /* fallback */) - avgEntry); // Approx
      // Better way: Net PnL / Total Risk Amount
      // If we don't have total risk, we estimate R based on planned SL
      if (pnl !== 0 && riskPerShare > 0) {
          // Total Risk = RiskPerShare * TotalQty (approx)
          // For simplicity in this view, let's just show Plan R if open, Realized R if closed?
          // Let's stick to the classic formula: (Target - Entry) / (Entry - SL) for planned R
          if (target > 0) {
             rMultiple = Math.abs((target - avgEntry) / (avgEntry - stopLoss));
          }
      }
  }

  // Format Dates safely
  const entryDate = trade.entryDate?.toMillis ? trade.entryDate.toDate() : new Date(trade.entryDate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[460px] p-0 border-l border-border/50 bg-card z-[100]"
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
                  <h2 className="text-2xl font-semibold text-foreground">{trade.symbol}</h2>
                  <Badge
                    variant="outline"
                    className={`${
                      trade.direction === "LONG"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {trade.direction}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${
                      trade.status === "CLOSED"
                        ? "border-border/50 bg-secondary/50 text-muted-foreground"
                        : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {trade.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {format(entryDate, "EEEE, MMMM d, yyyy • h:mm a")}
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
                  pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {trade.status === "CLOSED" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Net Realized P&L
                  </p>
              )}
            </motion.div>

            {/* Price Levels Card */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 divide-y divide-border/30">
              {/* Avg Entry */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <ArrowUp weight="regular" className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-muted-foreground text-sm">Avg Entry</span>
                </div>
                <span className="font-medium text-foreground">
                  ${avgEntry.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Avg Exit (Only if closed/partial) */}
              {avgExit > 0 && (
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10">
                      <ArrowDown weight="regular" className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-muted-foreground text-sm">Avg Exit</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${avgExit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Stop Loss */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Warning weight="regular" className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-muted-foreground text-sm">Stop Loss</span>
                </div>
                <span className="font-medium text-foreground">
                  {stopLoss > 0 ? `$${stopLoss.toLocaleString()}` : "-"}
                </span>
              </div>

              {/* Target */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Target</span>
                </div>
                <span className="font-medium text-foreground">
                  {target > 0 ? `$${target.toLocaleString()}` : "-"}
                </span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 divide-y divide-border/30">
              
              {/* R:R Ratio */}
              {rMultiple > 0 && (
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground text-sm">Planned R:R</span>
                    </div>
                    <span className="font-medium text-foreground">1 : {rMultiple.toFixed(2)}</span>
                  </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Net Quantity</span>
                </div>
                <span className="font-medium text-foreground">{trade.netQuantity}</span>
              </div>

              {/* Executions Count */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Executions</span>
                </div>
                <span className="font-medium text-foreground">{trade.totalExecutions || 0}</span>
              </div>

              {/* Total Fees */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">Total Fees</span>
                </div>
                <span className="font-medium text-foreground">
                  ${(trade.totalFees || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Trade Notes */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Note weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Trade Notes</h4>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {trade.notes || "No notes added."}
              </p>
            </div>

            {/* Screenshots */}
            {trade.screenshots && trade.screenshots.length > 0 && (
                <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image weight="regular" className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Screenshots</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {trade.screenshots.map((url, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-black/50 border border-white/10">
                              <img src={url} alt={`Screenshot ${idx+1}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                          </div>
                      ))}
                  </div>
                </div>
            )}

            {/* Strategy & Tags */}
            <div className="rounded-xl bg-secondary/20 border border-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Tags & Strategy</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Strategy Badge */}
                {trade.strategyId && (
                    <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                        Strategy Linked
                    </Badge>
                )}
                
                {/* Asset Class */}
                <Badge variant="outline" className="border-border/50 bg-secondary/50 text-foreground">
                    {trade.assetClass}
                </Badge>

                {/* Custom Tags */}
                {(trade.tags || []).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    {tag}
                  </Badge>
                ))}
                
                {(!trade.tags || trade.tags.length === 0) && !trade.strategyId && (
                    <span className="text-xs text-muted-foreground italic">No tags</span>
                )}
              </div>
            </div>
            
            {/* Audit Info (Footer) */}
            <div className="text-center pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                    Trade ID: <span className="font-mono">{trade.id.slice(0, 8)}...</span>
                </p>
                {trade.createdBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Created by User: <span className="font-mono">{trade.createdBy.slice(0, 6)}...</span>
                    </p>
                )}
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TradeDetailSheet;