import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trade, Execution } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { getTradeById, getTradeExecutions } from "@/services/tradeService";
import { getStrategies } from "@/services/strategyService";
import { format } from "date-fns";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { useNotebook } from "@/hooks/useNotebook";
import {
  ArrowLeft,
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
  BookOpen,
  Plus,
  Save,
  ExternalLink,
} from "lucide-react";
import { SpinnerGap } from "@phosphor-icons/react";

// --- Helpers ---
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
    <div className="bg-card rounded-xl card-boundary p-4 border border-border/50 shadow-sm">
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

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeAccount } = useWorkspace();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"overview" | "executions" | "analysis" | "journal">("overview");

  // Dynamic Data State
  const [trade, setTrade] = useState<Trade | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [linkedStrategy, setLinkedStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);

  // Notebook hook for trade note
  const { notes, createNote, saveNote, isLoading: notesLoading } = useNotebook(activeAccount?.id);

  // Find the linked notebook note for this trade
  const tradeNote = notes.find((n) => n.tradeId === id && !n.isTrashed) ?? null;

  // Local state for inline editing in Journal tab
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // Sync local editor state when the linked note loads / changes
  useEffect(() => {
    if (tradeNote) {
      setNoteTitle(tradeNote.title);
      setNoteContent(tradeNote.content);
    }
  }, [tradeNote?.id]);

  const handleCreateTradeNote = () => {
    if (!user || !id) return;
    createNote({
      title: trade ? `Trade Note — ${trade.symbol}` : "Trade Note",
      content: "",
      category: "Trade Note",
      tradeId: id,
      userId: user.uid,
    });
  };

  const handleSaveTradeNote = async () => {
    if (!tradeNote || !activeAccount?.id) return;
    setNoteSaving(true);
    await saveNote(tradeNote.id, { title: noteTitle, content: noteContent });
    setNoteSaving(false);
  };

  // Fetch Data from Firebase
  useEffect(() => {
    const fetchTradeDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedTrade = await getTradeById(id);
        if (fetchedTrade) {
          setTrade(fetchedTrade);

          // Fetch linked executions
          const execs = await getTradeExecutions(id);
          setExecutions(execs);

          // Fetch strategy if linked
          if (fetchedTrade.strategyId && fetchedTrade.accountId) {
            const strats = await getStrategies(fetchedTrade.accountId);
            const found = strats.find(s => s.id === fetchedTrade.strategyId);
            setLinkedStrategy(found || null);
          }
        }
      } catch (err) {
        console.error("Failed to load trade details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
        <SpinnerGap className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="font-medium">Loading trade details...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Trade not found</p>
          <button onClick={() => navigate("/trades")} className="text-sm text-primary hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const isWin = (trade.netPnl || 0) >= 0;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "executions" as const, label: `Executions (${executions.length})` },
    { id: "analysis" as const, label: "Analysis" },
    { id: "journal" as const, label: "Journal" },
  ];

  return (
    <div className="flex-1 pb-16 w-full">
      {/* Back */}
      <button onClick={() => navigate("/trades")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Trades
      </button>

      {/* Trade Header Card */}
      <div className="bg-card rounded-2xl card-boundary border border-border/50 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${isWin ? "bg-success/15 text-success" : "bg-loss/15 text-loss"}`}>
              {trade.direction?.toLowerCase() === "long" ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{trade.symbol}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${trade.status?.toLowerCase() === "closed" ? "bg-muted text-muted-foreground"
                    : trade.status?.toLowerCase() === "open" ? "bg-success/12 text-success"
                      : "bg-primary/12 text-primary"
                  }`}>
                  {trade.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${trade.direction?.toLowerCase() === "long" ? "bg-success/12 text-success" : "bg-loss/12 text-loss"
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
          <div className={`px-5 py-3 rounded-xl border ${isWin ? "bg-success/10 border-success/20" : "bg-loss/10 border-loss/20"}`}>
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
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <StatCard icon={DollarSign} label="Gross P&L" value={`${(trade.grossPnl || 0) >= 0 ? "+" : ""}${(trade.grossPnl || 0).toFixed(2)}`} color={(trade.grossPnl || 0) >= 0 ? "text-success" : "text-loss"} />
            <StatCard icon={Activity} label="Total Fees" value={`-${(trade.totalFees || 0).toFixed(2)}`} color="text-loss" />
            <StatCard icon={Target} label="Avg Entry" value={`$${(trade.avgEntryPrice || 0).toFixed(2)}`} />
            <StatCard icon={Target} label="Avg Exit" value={trade.avgExitPrice ? `$${trade.avgExitPrice.toFixed(2)}` : "-"} />
            <StatCard icon={Layers} label="Quantity" value={(trade.plannedQuantity || trade.quantity || 0).toString()} sublabel={`${executions.length} fills`} />
            <StatCard icon={Clock} label="Duration" value={formatDuration(trade.durationSeconds)} />
          </div>

          {/* Risk metrics */}
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
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
            <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>{linkedStrategy.emoji}</span> Strategy Checklist — {linkedStrategy.name}
              </h3>
              <div className="space-y-3">
                {linkedStrategy.rules.map(group => {
                  const total = group.items.length;

                  // Match checked rules with the new string array implementation
                  const checked = group.items.filter(item => {
                    const itemName = typeof item === 'string' ? item : (item as any).text;
                    return (trade.strategyRulesFollowed || []).includes(itemName);
                  }).length;

                  return (
                    <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-secondary/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{group.name}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${checked === total && total > 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                          }`}>
                          {checked}/{total}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="px-4 py-2.5 space-y-1.5">
                          {group.items.map((item, idx) => {
                            const itemName = typeof item === 'string' ? item : (item as any).text;
                            const isChecked = (trade.strategyRulesFollowed || []).includes(itemName);

                            return (
                              <div key={idx} className="flex items-start gap-2.5">
                                {isChecked ? (
                                  <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                                ) : (
                                  <Circle size={15} className="text-loss/60 mt-0.5 shrink-0" />
                                )}
                                <span className={`text-xs leading-relaxed ${isChecked ? "text-foreground" : "text-muted-foreground line-through"}`}>
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
          {executions.map((exec, idx) => (
            <div key={exec.id} className="bg-card rounded-xl card-boundary border border-border/50 p-4">
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
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize ${exec.side?.toLowerCase() === "buy" ? "bg-success/15 text-success" : "bg-loss/15 text-loss"
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
                  <p className="text-sm text-foreground">{exec.quantity}</p>
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

          {executions.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No executions recorded.</div>
          )}

          {/* Execution summary */}
          {executions.length > 0 && (
            <div className="bg-card rounded-xl card-boundary border border-border/50 p-4 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
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
          )}
        </div>
      )}

      {/* ── ANALYSIS TAB ── */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Advanced Performance */}
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
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
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
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
          {/* Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
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

          {/* Notes (trade.notes field) */}
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-muted-foreground" /> Trade Notes (from Trade Form)
            </h3>
            {trade.notes ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes recorded</p>
            )}
          </div>

          {/* Notebook Trade Note */}
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen size={14} className="text-muted-foreground" /> Notebook Note
              </h3>
              {tradeNote && (
                <button
                  onClick={() => navigate(`/notebook`)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={12} /> Open in Notebook
                </button>
              )}
            </div>

            {notesLoading ? (
              <div className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
            ) : tradeNote ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your trade analysis, observations, and lessons..."
                  rows={6}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Last updated {tradeNote.updatedAt ? format(tradeNote.updatedAt.toDate(), "MMM d, yyyy 'at' h:mm a") : ""}
                  </p>
                  <button
                    onClick={handleSaveTradeNote}
                    disabled={noteSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    <Save size={12} />
                    {noteSaving ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-xl">
                <BookOpen size={24} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">No notebook note yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Create a dedicated Trade Note for this trade to capture your deeper analysis.
                </p>
                <button
                  onClick={handleCreateTradeNote}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <Plus size={12} /> Create Trade Note
                </button>
              </div>
            )}
          </div>

          {/* Mistakes */}
          {trade.mistakes && trade.mistakes.length > 0 && (
            <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
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
          <div className="bg-card rounded-2xl card-boundary border border-border/50 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Screenshots</h3>
            {trade.screenshots && trade.screenshots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trade.screenshots.map((s, i) => (
                  <div key={i} className="aspect-video bg-secondary/40 rounded-xl border border-border overflow-hidden">
                    <img src={s} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
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
  );
}