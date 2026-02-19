import { useState, useEffect } from "react";
import {
  X,
  PencilSimple,
  Trash,
  Copy,
  Download,
  Clock,
  Target,
  ChartLineUp,
  Hash,
  ShareNetwork,
  Eye,
  Tag
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade, Execution } from "@/types/trade";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getTradeExecutions } from "@/services/tradeService";
import { getStrategyById } from "@/services/strategyService";
import { useSettings } from "@/contexts/SettingsContext";

interface TradeDetailModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

// --- 📊 Micro-Components ---

const MetricCard = ({ label, value, subtext, trend, tooltip }: any) => (
  <div className="p-3 rounded-xl bg-secondary/10 border border-border/40 flex flex-col justify-between min-h-[80px]">
    <div className="flex justify-between items-start mb-1">
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><div className="cursor-help opacity-50 hover:opacity-100 text-[10px]">?</div></TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <div className="flex items-baseline gap-2">
      <span className={`text-lg font-semibold tracking-tight tabular-nums ${
        trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-foreground'
      }`}>
        {value}
      </span>
    </div>
    {subtext && <span className="text-[10px] text-muted-foreground">{subtext}</span>}
  </div>
);

const DetailRow = ({ label, value, copyable }: { label: string, value: string, copyable?: boolean }) => (
  <div className="flex justify-between items-center py-2 text-sm group">
    <span className="text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="font-medium text-foreground tabular-nums">{value}</span>
      {copyable && (
        <button 
          onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied to clipboard"); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
        >
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  </div>
);

// --- 🚀 Main Component ---

const TradeDetailModal = ({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TradeDetailModalProps) => {
  const { formatCurrency } = useSettings();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [strategyName, setStrategyName] = useState<string>("-");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch Details ---
  useEffect(() => {
    if (open && trade) {
      setIsLoading(true);
      Promise.all([
        getTradeExecutions(trade.id),
        trade.strategyId ? getStrategyById(trade.strategyId) : Promise.resolve(null)
      ]).then(([execs, strat]) => {
        setExecutions(execs);
        setStrategyName(strat ? strat.name : "No Strategy");
      }).catch(err => {
        console.error("Failed to load details", err);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [open, trade?.id]);

  if (!trade) return null;

  // --- 🧮 Computed View Model ---
  const isLong = trade.direction === "LONG";
  const isWin = (trade.netPnl || 0) > 0;
  
  const avgEntry = trade.avgEntryPrice || 0;
  const avgExit = trade.avgExitPrice || 0;
  const peakInvested = trade.peakInvested || (Math.abs(trade.netQuantity) * avgEntry);
  const totalFees = trade.totalFees || 0;

  const durationStr = trade.durationSeconds 
    ? `${(trade.durationSeconds / 3600).toFixed(1)}h` 
    : "Open";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ FIXES:
          1. h-[85vh]: Sets a fixed height so the inner ScrollArea can work (fixes "no scroll bar").
          2. [&>button]:hidden: CSS hack to hide the default Shadcn/Radix close button (fixes "two cut buttons").
      */}
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-card rounded-2xl overflow-hidden border border-border/50 shadow-2xl [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Trade Details {trade.symbol}</DialogTitle>
        </DialogHeader>

        {/* --- Header: Identity & Actions --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-secondary/5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{trade.symbol}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`
                text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border
                ${isLong ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}
              `}>
                {trade.direction}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide border-transparent">
                {trade.status}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {trade.entryDate ? format(trade.entryDate.toDate(), "MMM d, yyyy") : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(trade)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <PencilSimple weight="bold" className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ShareNetwork weight="bold" className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-border/50 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => onDelete(trade)} className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10">
              <Trash weight="bold" className="w-4 h-4" />
            </Button>
            {/* This is the Custom Close Button ("the one that u see") */}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X weight="bold" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* --- Tabs Navigation --- */}
        <div className="px-6 border-b border-border/40 bg-card flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-11 bg-transparent p-0 gap-6 w-full justify-start">
              {["overview", "metrics", "advanced", "executions", "journal"].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-sm text-muted-foreground data-[state=active]:text-foreground transition-colors capitalize"
                >
                  {tab}
                  {tab === "executions" && executions.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-secondary px-1.5 py-0.5 rounded-full text-foreground">{executions.length}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* --- Scrollable Content --- */}
        <ScrollArea className="flex-1 bg-background/50">
          <div className="p-6">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Hero P&L */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/40">
                  <div className="bg-card p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Net P&L</span>
                    <span className={`text-4xl font-bold tracking-tighter tabular-nums ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                      {isWin ? "+" : ""}{formatCurrency(trade.netPnl || 0)}
                    </span>
                  </div>
                  <div className="bg-card p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Return</span>
                    <span className={`text-4xl font-bold tracking-tighter tabular-nums ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                      {trade.returnPercent ? `${trade.returnPercent > 0 ? "+" : ""}${trade.returnPercent.toFixed(2)}%` : "-"}
                    </span>
                  </div>
                  <div className="bg-card p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">R-Multiple</span>
                    <span className={`text-4xl font-bold tracking-tighter tabular-nums ${trade.riskMultiple && trade.riskMultiple > 0 ? "text-emerald-500" : "text-foreground"}`}>
                      {trade.riskMultiple ? `${trade.riskMultiple.toFixed(2)}R` : "-"}
                    </span>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="relative w-full h-[240px] bg-secondary/5 border border-border/40 rounded-xl flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 flex flex-col justify-between py-8 px-4 opacity-20">
                    <div className="w-full h-px bg-border border-t border-dashed" />
                    <div className="w-full h-px bg-border border-t border-dashed" />
                    <div className="w-full h-px bg-border border-t border-dashed" />
                  </div>
                  <div className="text-center z-10">
                    <ChartLineUp weight="duotone" className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground font-medium">Chart Snapshot</p>
                    <p className="text-xs text-muted-foreground/60">Integrate TradingView here</p>
                  </div>
                  
                  {/* Price Level Lines (Visual Only) */}
                  <div className="absolute right-0 top-[30%] w-full border-t border-dashed border-emerald-500/50 flex justify-end">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1">ENTRY {formatCurrency(avgEntry)}</span>
                  </div>
                  {avgExit > 0 && (
                    <div className="absolute right-0 top-[60%] w-full border-t border-dashed border-blue-500/50 flex justify-end">
                      <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1">EXIT {formatCurrency(avgExit)}</span>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Levels */}
                  <div className="bg-card rounded-xl border border-border/40 p-5 space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4" /> Price Levels
                    </h3>
                    <div className="divide-y divide-border/30">
                      <DetailRow label="Avg Entry" value={formatCurrency(avgEntry)} copyable />
                      <DetailRow label="Avg Exit" value={avgExit > 0 ? formatCurrency(avgExit) : "-"} />
                      <DetailRow label="Initial Stop" value={trade.initialStopLoss ? formatCurrency(trade.initialStopLoss) : "-"} />
                      <DetailRow label="Target" value={trade.takeProfitTarget ? formatCurrency(trade.takeProfitTarget) : "-"} />
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="bg-card rounded-xl border border-border/40 p-5 space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Trade Stats
                    </h3>
                    <div className="divide-y divide-border/30">
                      <DetailRow label="Quantity" value={trade.netQuantity?.toString() || "0"} />
                      <DetailRow label="Total Fees" value={formatCurrency(totalFees)} />
                      <DetailRow label="Duration" value={durationStr} />
                      <DetailRow label="Strategy" value={strategyName} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. METRICS TAB (FIXED: Only Single Trade Metrics) */}
            {activeTab === "metrics" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                  label="Risk Amount" 
                  value={formatCurrency(trade.riskAmount || 0)}
                  tooltip="Amount risked based on SL"
                />
                <MetricCard 
                  label="Planned R:R" 
                  value={trade.plannedRR ? trade.plannedRR.toFixed(2) : "-"}
                  tooltip="Reward to Risk Ratio"
                />
                <MetricCard 
                  label="Profit Capture" 
                  value={trade.profitCapture ? `${trade.profitCapture.toFixed(1)}%` : "-"}
                  subtext="Of potential move"
                />
                <MetricCard 
                  label="Capital Efficiency" 
                  value={trade.holdingPeriodReturn ? `${trade.holdingPeriodReturn.toFixed(2)}%` : "-"}
                  subtext="Return on Peak Capital"
                />
                <MetricCard 
                  label="Max Drawdown" 
                  value={trade.drawdown ? `${trade.drawdown.toFixed(2)}%` : "-"}
                  trend="down"
                  subtext="During trade"
                />
                 <MetricCard 
                  label="Slippage" 
                  value={formatCurrency(trade.totalSlippage || 0)}
                  tooltip="Diff between Order & Fill"
                />
                 <MetricCard 
                  label="Entry Score" 
                  value={trade.executionScore ? `${(trade.executionScore * 100).toFixed(0)}%` : "-"}
                  tooltip="Quality of entry price"
                />
                {/* Replaced WinRate/ProfitFactor with Duration for single context */}
                <MetricCard 
                   label="Duration"
                   value={durationStr}
                   subtext="Time in trade"
                />
              </div>
            )}

            {/* 3. ADVANCED TAB */}
            {activeTab === "advanced" && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/30 bg-secondary/5">
                    <h4 className="font-semibold text-sm">Drawdown & Capital</h4>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Peak Invested</span>
                      <p className="text-xl font-mono">{formatCurrency(peakInvested)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Max Drawdown</span>
                      <p className="text-xl font-mono text-rose-500">
                        {trade.drawdown ? `${trade.drawdown.toFixed(2)}%` : "0.00%"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Slippage</span>
                      <p className="text-xl font-mono text-amber-500">
                        {formatCurrency(trade.totalSlippage || 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Entry Efficiency</span>
                      <p className="text-xl font-mono">
                        {trade.executionScore ? `${(trade.executionScore * 100).toFixed(0)}%` : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. EXECUTIONS TAB */}
            {activeTab === "executions" && (
              <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Side</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Date</th>
                      <th className="px-4 py-3 text-right">Fees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {executions.map((exec) => (
                      <tr key={exec.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            exec.side === "BUY" 
                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" 
                            : "border-rose-500/20 bg-rose-500/5 text-rose-500"
                          }`}>
                            {exec.side}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{exec.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(exec.price)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                          {format(exec.date.toDate(), "MMM d HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(exec.fees)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. JOURNAL TAB */}
            {activeTab === "journal" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {trade.tags?.length > 0 ? trade.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-secondary/30 hover:bg-secondary/50 text-foreground px-3 py-1">
                        <Tag className="w-3 h-3 mr-1 opacity-50" />
                        {tag}
                      </Badge>
                    )) : (
                      <span className="text-sm text-muted-foreground italic">No tags</span>
                    )}
                  </div>
                </div>
                
                <Separator />

                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</span>
                  <div className="p-4 rounded-xl bg-secondary/10 border border-border/30 min-h-[120px]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 font-sans">
                      {trade.notes || <span className="text-muted-foreground italic">No notes added to this trade.</span>}
                    </p>
                  </div>
                </div>

                {trade.screenshots?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Screenshots</span>
                      <div className="grid grid-cols-2 gap-4">
                        {trade.screenshots.map((url, i) => (
                          <div key={i} className="group relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-border/30 cursor-pointer hover:ring-2 ring-primary/50 transition-all">
                            <img src={url} alt="Proof" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 backdrop-blur-[1px] transition-all">
                              <Eye className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

           

          </div>
        </ScrollArea>
        
        {/* --- Footer --- */}
        <div className="px-6 py-3 border-t border-border/40 bg-secondary/5 flex justify-between items-center flex-shrink-0">
          
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-2" /> Export
             </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default TradeDetailModal;