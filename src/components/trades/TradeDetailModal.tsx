// src/components/trades/TradeDetailModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Clock,
  Shield,
  Zap,
  CheckCircle2,
  Circle,
  MessageSquare,
  Tag,
  Layers,
  Gauge,
  Edit2,
  Trash2,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Types and Services
import { Trade, Execution } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { getStrategies } from "@/services/strategyService";
import { getTradeExecutions } from "@/services/tradeService";

// --- Constants & Helpers ---
const TRADE_EMOTIONS = [
  { value: "CONFIDENT", label: "Confident", emoji: "😎" },
  { value: "NEUTRAL", label: "Neutral", emoji: "😐" },
  { value: "FEARFUL", label: "Fearful", emoji: "😨" },
  { value: "GREEDY", label: "Greedy", emoji: "🤑" },
  { value: "REVENGING", label: "Revenging", emoji: "😡" },
  { value: "FOMO", label: "FOMO", emoji: "🏃‍♂️" },
  { value: "HESITANT", label: "Hesitant", emoji: "🤔" },
];

const toDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === "function") return val.toDate();
  return new Date(val);
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && d === 0) parts.push(`${s}s`);
  return parts.join(" ") || "< 1s";
}

function StatCard({ icon: Icon, label, value, color, sublabel }: {
  icon: React.ElementType; label: string; value: string; color?: string; sublabel?: string;
}) {
  return (
    <div className="bg-card rounded-xl card-boundary border border-border/40 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-sm font-bold mt-0.5 ${color || "text-foreground"}`}>{value}</p>
          {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

// --- Interfaces ---
interface TradeDetailModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

export default function TradeDetailModal({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TradeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "executions" | "analysis" | "journal">("overview");
  
  // Dynamic Data State
  const [linkedStrategy, setLinkedStrategy] = useState<Strategy | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Reset tab on open
  useEffect(() => {
    if (open) setActiveTab("overview");
  }, [open]);

  // Fetch Strategy & Executions natively from Firebase
  useEffect(() => {
    if (!trade || !open) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        if (trade.strategyId && trade.accountId) {
          const strats = await getStrategies(trade.accountId);
          const found = strats.find(s => s.id === trade.strategyId);
          setLinkedStrategy(found || null);
        } else {
          setLinkedStrategy(null);
        }

        const execs = await getTradeExecutions(trade.id);
        setExecutions(execs);
      } catch (err) {
        console.error("Error fetching trade details:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [trade, open]);

  if (!trade) return null;

  const isWin = (trade.netPnl || 0) >= 0;
  const emotionInfo = TRADE_EMOTIONS.find(e => e.value === trade.emotion);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "executions" as const, label: `Executions (${executions.length || trade.totalExecutions || 0})` },
    { id: "analysis" as const, label: "Analysis" },
    { id: "journal" as const, label: "Journal" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 bg-background border-border overflow-hidden max-h-[90vh] rounded-2xl flex flex-col shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Trade Details</DialogTitle>
          <DialogDescription>Detailed view of the trade.</DialogDescription>
        </DialogHeader>

        {/* --- Sticky Header Area --- */}
        <div className="bg-card z-10 px-6 pt-6 border-b border-border/50 shrink-0">
          
          {/* Top Actions & Quick Close */}
          <div className="flex justify-end gap-2 mb-2 absolute right-4 top-4">
            <button onClick={() => onEdit(trade)} className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(trade)} className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-2">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 shadow-sm ${isWin ? "bg-success/15 text-success" : "bg-loss/15 text-loss"}`}>
                {trade.direction?.toLowerCase() === "long" ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">{trade.symbol}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    trade.status?.toLowerCase() === "closed" ? "bg-muted text-muted-foreground"
                    : trade.status?.toLowerCase() === "open" ? "bg-success/12 text-success"
                    : "bg-primary/12 text-primary"
                  }`}>
                    {trade.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    trade.direction?.toLowerCase() === "long" ? "bg-success/12 text-success" : "bg-loss/12 text-loss"
                  }`}>
                    {trade.direction}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(toDate(trade.entryDate), "EEE, MMM dd, yyyy · HH:mm")}
                  {trade.exitDate && ` → ${format(toDate(trade.exitDate), "HH:mm")}`}
                </p>
                {linkedStrategy && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs">{linkedStrategy.emoji}</span>
                    <span className="text-xs text-primary font-semibold">{linkedStrategy.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PnL hero */}
            <div className={`px-5 py-3 rounded-xl border shadow-sm ${isWin ? "bg-success/5 border-success/20" : "bg-loss/5 border-loss/20"}`}>
              <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">Net P&L</p>
              <p className={`text-2xl font-bold tabular-nums ${isWin ? "text-success" : "text-loss"}`}>
                {isWin ? "+" : ""}{(trade.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {trade.returnPercent !== undefined && (
                <p className={`text-xs font-semibold mt-0.5 ${isWin ? "text-success" : "text-loss"}`}>
                  {trade.returnPercent > 0 ? "+" : ""}{trade.returnPercent.toFixed(2)}%
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-background">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <StatCard icon={DollarSign} label="Gross P&L" value={`${(trade.grossPnl || 0) >= 0 ? "+" : ""}${(trade.grossPnl || 0).toFixed(2)}`} color={(trade.grossPnl || 0) >= 0 ? "text-success" : "text-loss"} />
                <StatCard icon={Activity} label="Total Fees" value={`-${(trade.totalFees || 0).toFixed(2)}`} color="text-loss" />
                <StatCard icon={Target} label="Avg Entry" value={`$${(trade.avgEntryPrice || 0).toFixed(2)}`} />
                <StatCard icon={Target} label="Avg Exit" value={trade.avgExitPrice ? `$${trade.avgExitPrice.toFixed(2)}` : "-"} />
                <StatCard icon={Layers} label="Quantity" value={(trade.plannedQuantity || 0).toString()} sublabel={`${trade.totalExecutions || 0} fills`} />
                <StatCard icon={Clock} label="Duration" value={formatDuration(trade.durationSeconds)} />
              </div>

              {/* Risk metrics */}
              <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-muted-foreground" /> Risk Management
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Stop Loss</p>
                    <p className="text-sm font-bold text-foreground">{trade.initialStopLoss ? `$${trade.initialStopLoss.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Take Profit</p>
                    <p className="text-sm font-bold text-foreground">{trade.takeProfitTarget ? `$${trade.takeProfitTarget.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Risk Amount</p>
                    <p className="text-sm font-bold text-loss">{trade.riskAmount ? `$${trade.riskAmount.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Planned R:R</p>
                    <p className="text-sm font-bold text-foreground">{trade.plannedRR ? `${trade.plannedRR.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">R-Multiple</p>
                    <p className={`text-sm font-bold ${(trade.riskMultiple || 0) >= 0 ? "text-success" : "text-loss"}`}>
                      {trade.riskMultiple ? `${trade.riskMultiple.toFixed(2)}R` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategy Checklist */}
              {linkedStrategy && linkedStrategy.rules && (
                <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span>{linkedStrategy.emoji}</span> Strategy Checklist — {linkedStrategy.name}
                  </h3>
                  <div className="space-y-3">
                    {linkedStrategy.rules.map(group => {
                      const total = group.items.length;
                      
                      // Match the checked rules string array
                      const checked = group.items.filter(item => {
                        const itemName = typeof item === 'string' ? item : (item as any).text;
                        return (trade.strategyRulesFollowed || []).includes(itemName);
                      }).length;

                      return (
                        <div key={group.id} className="border border-border/40 rounded-xl overflow-hidden bg-card">
                          <div className="px-4 py-2.5 bg-secondary/20 flex items-center justify-between border-b border-border/40">
                            <span className="text-xs font-bold text-foreground">{group.name}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              checked === total && total > 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                            }`}>
                              {checked}/{total}
                            </span>
                          </div>
                          {total > 0 && (
                            <div className="px-4 py-3 space-y-2">
                              {group.items.map((item, idx) => {
                                const itemName = typeof item === 'string' ? item : (item as any).text;
                                const itemId = typeof item === 'string' ? item : ((item as any).id || idx);
                                const isChecked = (trade.strategyRulesFollowed || []).includes(itemName);

                                return (
                                  <div key={itemId} className="flex items-start gap-2.5">
                                    {isChecked ? (
                                      <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                    ) : (
                                      <Circle size={15} className="text-loss/60 mt-0.5 shrink-0" />
                                    )}
                                    <span className={`text-sm leading-snug ${isChecked ? "text-foreground" : "text-muted-foreground line-through"}`}>
                                      {itemName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXECUTIONS TAB ── */}
          {activeTab === "executions" && (
            <div className="space-y-3">
              {loadingData ? (
                 <div className="p-10 text-center text-muted-foreground animate-pulse">Loading executions...</div>
              ) : executions.length > 0 ? (
                <>
                  {executions.map((exec, idx) => (
                    <div key={exec.id} className="bg-card rounded-xl card-boundary border border-border/40 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="w-8 shrink-0">
                          <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        </div>
                        <div className="w-36 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Date & Time</p>
                          <p className="text-sm font-medium text-foreground">{format(toDate(exec.date), "MMM dd, yyyy · HH:mm")}</p>
                        </div>
                        <div className="w-16 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Side</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                            exec.side?.toLowerCase() === "buy" ? "bg-success/15 text-success" : "bg-loss/15 text-loss"
                          }`}>
                            {exec.side}
                          </span>
                        </div>
                        <div className="w-24 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Price</p>
                          <p className="text-sm font-semibold text-foreground">${(exec.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="w-16 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Qty</p>
                          <p className="text-sm text-foreground">{exec.quantity || 0}</p>
                        </div>
                        <div className="w-24 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Value</p>
                          <p className="text-sm text-foreground">${((exec.price || 0) * (exec.quantity || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="w-20 shrink-0">
                          <p className="text-[11px] text-muted-foreground">Fees</p>
                          <p className="text-sm text-loss">-${(exec.fees || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Execution summary */}
                  <div className="bg-card rounded-xl card-boundary border border-border/40 p-4 mt-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-[11px] text-muted-foreground font-semibold">Total Buy Value</p>
                          <p className="text-sm font-bold text-foreground">${(trade.totalBuyValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground font-semibold">Total Sell Value</p>
                          <p className="text-sm font-bold text-foreground">${(trade.totalSellValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground font-semibold">Total Fees</p>
                          <p className="text-sm font-bold text-loss">-${(trade.totalFees || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground font-semibold">Net Result</p>
                        <p className={`text-lg font-bold ${isWin ? "text-success" : "text-loss"}`}>
                          {isWin ? "+" : ""}${(trade.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center text-muted-foreground">No executions found.</div>
              )}
            </div>
          )}

          {/* ── ANALYSIS TAB ── */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* Advanced Performance */}
              <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-muted-foreground" /> Advanced Performance
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">MAE (Max Adverse)</p>
                    <p className="text-sm font-bold text-loss">{trade.mae ? `$${trade.mae.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">MFE (Max Favorable)</p>
                    <p className="text-sm font-bold text-success">{trade.mfe ? `$${trade.mfe.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Profit Capture</p>
                    <p className="text-sm font-bold text-foreground">{trade.profitCapture ? `${(trade.profitCapture * 100).toFixed(1)}%` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Holding Period Return</p>
                    <p className="text-sm font-bold text-foreground">{trade.holdingPeriodReturn ? `${trade.holdingPeriodReturn.toFixed(2)}%` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Profit Velocity</p>
                    <p className="text-sm font-bold text-foreground">{trade.profitVelocity ? `$${trade.profitVelocity.toFixed(2)}/hr` : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Execution Quality */}
              <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gauge size={16} className="text-muted-foreground" /> Execution Quality
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Total Slippage</p>
                    <p className="text-sm font-bold text-foreground">{trade.totalSlippage ? `$${trade.totalSlippage.toFixed(2)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Execution Score</p>
                    {trade.executionScore ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-2 flex-1 max-w-[100px] rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${trade.executionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground">{(trade.executionScore * 100).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-foreground">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Discipline Score</p>
                    {trade.disciplineScore ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-2 flex-1 max-w-[100px] rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${trade.disciplineScore * 100}%`,
                              backgroundColor: trade.disciplineScore >= 0.7 ? "hsl(var(--success))" : trade.disciplineScore >= 0.4 ? "hsl(38 92% 55%)" : "hsl(var(--loss))",
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground">{(trade.disciplineScore * 100).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-foreground">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── JOURNAL TAB ── */}
          {activeTab === "journal" && (
            <div className="space-y-6">
              {/* Emotion + Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    Emotion
                  </h3>
                  {emotionInfo ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emotionInfo.emoji}</span>
                      <span className="text-sm font-semibold text-foreground capitalize">{emotionInfo.label}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No emotion recorded</p>
                  )}
                </div>

                <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Tag size={14} className="text-muted-foreground" /> Tags
                  </h3>
                  {trade.tags && trade.tags.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {trade.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-muted-foreground" /> Notes
                </h3>
                {trade.notes ? (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes recorded</p>
                )}
              </div>

              {/* Mistakes */}
              {trade.mistakes && trade.mistakes.length > 0 && (
                <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Mistakes</h3>
                  <div className="space-y-1.5">
                    {trade.mistakes.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-loss shrink-0" />
                        <span className="text-sm text-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screenshots placeholder */}
              <div className="bg-card rounded-2xl card-boundary border border-border/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3">Screenshots</h3>
                {trade.screenshots && trade.screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {trade.screenshots.map((s, i) => (
                      <div key={i} className="aspect-video bg-secondary/40 rounded-xl border border-border overflow-hidden">
                        <img src={s} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No screenshots attached</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}