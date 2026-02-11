import { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
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
  Strategy as StrategyIcon,
  Receipt
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade, Execution } from "@/types/trade";
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
import { getTradeExecutions } from "@/services/tradeService"; 
import { getStrategyById } from "@/services/strategyService"; 

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
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [strategyName, setStrategyName] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- Fetch Data on Open ---
  useEffect(() => {
    if (open && trade) {
      setLoadingDetails(true);
      
      const fetchData = async () => {
        try {
          // 1. Fetch Executions (Now permitted by fixed Rules)
          const execs = await getTradeExecutions(trade.id);
          setExecutions(execs);

          // 2. Fetch Strategy Name
          if (trade.strategyId) {
            const strategy = await getStrategyById(trade.strategyId);
            setStrategyName(strategy ? strategy.name : "Unknown Strategy");
          } else {
            setStrategyName(null);
          }
        } catch (error) {
          console.error("Failed to load details:", error);
        } finally {
          setLoadingDetails(false);
        }
      };

      fetchData();
    }
  }, [open, trade?.id]);

  if (!trade) return null;

  // --- Safe Accessors ---
  const avgEntry = trade.avgEntryPrice || 0;
  const avgExit = trade.avgExitPrice || 0;
  const stopLoss = trade.initialStopLoss || 0;
  const target = trade.takeProfitTarget || 0;
  const pnl = trade.netPnl || 0;
  
  // --- Smart R-Multiple Calculation ---
  let rMultiple = trade.riskMultiple || 0;
  if (rMultiple === 0 && stopLoss > 0 && avgEntry > 0) {
      const riskPerShare = Math.abs(avgEntry - stopLoss);
      if (riskPerShare > 0) {
          // If closed, calculate Realized R
          if (trade.status === "CLOSED") {
             // Fallback: If initialSize is 0 (legacy data), use netQuantity or guess 1 unit
             const size = trade.initialQuantity || trade.netQuantity || 1;
             rMultiple = pnl / (riskPerShare * size);
          } 
          // If open, calculate Planned R
          else if (target > 0) {
             rMultiple = Math.abs((target - avgEntry) / (avgEntry - stopLoss));
          }
      }
  }

  // --- Fallback for Initial Size ---
  // If trade.initialQuantity is 0 (legacy data), show netQuantity or hide it
  const displaySize = trade.initialQuantity > 0 ? trade.initialQuantity : trade.netQuantity;

  // --- Helpers ---
  const formatDate = (dateInput: any) => {
    try {
      const date = typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
      return format(date, "MMM d, yyyy • h:mm a");
    } catch { return "-"; }
  };

  const formatExecDate = (dateInput: any) => {
    try {
        const date = typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
        return format(date, "MMM d HH:mm");
    } catch { return "-"; }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[500px] p-0 border-l border-border/50 bg-card z-[100] shadow-2xl focus:outline-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Trade Details: {trade.symbol}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full">
          <div className="flex flex-col min-h-full pb-10">
            
            {/* --- Hero Section --- */}
            <div className="p-6 pb-8 border-b border-border/30 bg-gradient-to-b from-secondary/10 to-transparent">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">{trade.symbol}</h2>
                    <Badge
                      variant="outline"
                      className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
                        trade.direction === "LONG"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {trade.direction}
                    </Badge>
                    {trade.status === "CLOSED" && (
                        <Badge variant="secondary" className="text-xs bg-secondary/80 text-muted-foreground border-transparent">
                            Closed
                        </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm font-medium">
                    {formatDate(trade.entryDate)}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 bg-background/50 rounded-full p-1 border border-border/20 backdrop-blur-sm">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(trade)} className="h-8 w-8 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground">
                    <PencilSimple weight="bold" className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(trade)} className="h-8 w-8 hover:bg-rose-500/10 rounded-full text-muted-foreground hover:text-rose-500">
                    <Trash weight="bold" className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-border/50 mx-1" />
                  <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground">
                    <X weight="bold" className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* P&L Display */}
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-end"
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Net Result</span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold tracking-tighter tabular-nums ${
                      pnl >= 0 ? "text-emerald-500" : pnl < 0 ? "text-rose-500" : "text-foreground"
                    }`}>
                      {pnl >= 0 ? "+" : ""}{Math.abs(pnl).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </span>
                </div>
                
                {Math.abs(rMultiple) > 0.01 && (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        rMultiple > 0 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                    }`}>
                        <ChartLineUp weight="bold" className="w-3.5 h-3.5" />
                        {rMultiple > 0 ? "+" : ""}{rMultiple.toFixed(2)}R
                    </div>
                )}
              </motion.div>
            </div>

            {/* --- Main Content --- */}
            <div className="p-6 space-y-8">
              
              {/* 1. Plan & Levels */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4" /> Plan & Levels
                </h4>
                <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">
                    <div className="grid grid-cols-3 divide-x divide-border/30">
                        <div className="p-4 flex flex-col items-center text-center bg-secondary/5">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Entry</span>
                            <span className="text-sm font-bold text-foreground tabular-nums">${avgEntry.toLocaleString()}</span>
                        </div>
                        <div className="p-4 flex flex-col items-center text-center bg-rose-500/5 relative overflow-hidden">
                            <span className="text-[10px] uppercase tracking-wide text-rose-500/70 font-bold mb-1">Stop</span>
                            <span className="text-sm font-bold text-rose-500 tabular-nums">{stopLoss > 0 ? `$${stopLoss.toLocaleString()}` : "-"}</span>
                        </div>
                        <div className="p-4 flex flex-col items-center text-center bg-emerald-500/5 relative overflow-hidden">
                            <span className="text-[10px] uppercase tracking-wide text-emerald-500/70 font-bold mb-1">Target</span>
                            <span className="text-sm font-bold text-emerald-500 tabular-nums">{target > 0 ? `$${target.toLocaleString()}` : "-"}</span>
                        </div>
                    </div>
                    {avgExit > 0 && (
                        <div className="py-2.5 px-4 bg-secondary/20 flex justify-between items-center border-t border-border/30">
                            <span className="text-xs font-medium text-muted-foreground">Avg Exit Price</span>
                            <span className="text-sm font-bold text-foreground tabular-nums">${avgExit.toLocaleString()}</span>
                        </div>
                    )}
                </div>
              </section>

              {/* 2. Executions Ledger */}
              <section className="space-y-3">
                 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> Executions
                 </h4>
                 {loadingDetails ? (
                     <div className="h-20 rounded-xl bg-secondary/20 animate-pulse" />
                 ) : executions.length > 0 ? (
                     <div className="rounded-xl border border-border/30 overflow-hidden text-sm">
                        <table className="w-full">
                            <thead className="bg-secondary/20 text-xs text-muted-foreground uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-2 text-left">Time</th>
                                    <th className="px-4 py-2 text-center">Side</th>
                                    <th className="px-4 py-2 text-right">Price</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {executions.map((exec) => (
                                    <tr key={exec.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">
                                            {formatExecDate(exec.date)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                exec.side === "BUY" 
                                                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" 
                                                : "border-rose-500/30 text-rose-500 bg-rose-500/5"
                                            }`}>
                                                {exec.side}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                            ${exec.price.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                                            {exec.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 ) : (
                     <div className="p-4 rounded-xl border border-border/30 bg-secondary/5 text-center">
                        <p className="text-xs text-muted-foreground italic">No executions recorded.</p>
                     </div>
                 )}
              </section>

              {/* 3. Trade Stats */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 rounded-xl bg-secondary/5 border border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock weight="fill" className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-medium uppercase">Duration</span>
                    </div>
                    {/* Placeholder for duration logic */}
                    <p className="text-sm font-semibold text-foreground">
                       {trade.durationSeconds ? `${(trade.durationSeconds / 60).toFixed(0)}m` : "-"}
                    </p> 
                 </div>
                 
                 <div className="p-3 rounded-xl bg-secondary/5 border border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CurrencyDollar weight="fill" className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-medium uppercase">Fees</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground tabular-nums">${trade.totalFees.toFixed(2)}</p>
                 </div>

                 <div className="p-3 rounded-xl bg-secondary/5 border border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ChartLineUp weight="fill" className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-medium uppercase">Initial Size</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                        {displaySize}
                    </p>
                 </div>

                 <div className="p-3 rounded-xl bg-secondary/5 border border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag weight="fill" className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-medium uppercase">Asset</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{trade.assetClass}</p>
                 </div>
              </div>

              {/* 4. Strategy & Notes */}
              <section className="space-y-4 pt-2">
                {/* Strategy Chip (Now shows real name) */}
                {strategyName && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                            <StrategyIcon weight="duotone" className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Strategy</p>
                            <p className="text-sm font-semibold">{strategyName}</p>
                        </div>
                    </div>
                )}

                {/* Notes Area */}
                <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Note className="w-4 h-4" /> Notes
                    </h4>
                    <div className="p-4 rounded-xl bg-secondary/10 border border-border/30 min-h-[80px]">
                        {trade.notes ? (
                            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal font-sans">
                                {trade.notes}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No notes added.</p>
                        )}
                    </div>
                </div>

                {/* Tags */}
                {trade.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {trade.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-secondary/50 text-muted-foreground hover:text-foreground py-1 px-3 rounded-lg font-normal transition-colors cursor-default">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
              </section>

              {/* 5. Screenshots */}
              {trade.screenshots && trade.screenshots.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Image className="w-4 h-4" /> Screenshots
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {trade.screenshots.map((url, idx) => (
                            <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-border/30 cursor-zoom-in hover:shadow-lg transition-all">
                                <img 
                                    src={url} 
                                    alt={`Proof ${idx + 1}`} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                </section>
              )}

              {/* Footer (Metadata) */}
              <div className="pt-8 border-t border-border/20 text-center pb-4">
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                      Logged via TradeOmen
                  </p>
              </div>

            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TradeDetailSheet;