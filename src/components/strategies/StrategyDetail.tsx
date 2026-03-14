import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  DollarSign,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  Activity,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Strategy } from "@/types/strategy";
import { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

// --- Industry Grade Imports ---
import { useTrades } from "@/hooks/useTrades";
import EditTradeModal from "@/components/trades/EditTradeModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ------------------------------------------------------------------
// 🔧 UTILITY: Date Parsing
// ------------------------------------------------------------------
const getDateMillis = (date: any): number => {
  if (!date) return 0;
  if (typeof date.toMillis === "function") return date.toMillis();
  if (date instanceof Date) return date.getTime();
  return new Date(date).getTime();
};

interface StrategyDetailProps {
  strategy: Strategy;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

type SortField = keyof Trade | "pnl";

// ------------------------------------------------------------------
// 🎨 UI COMPONENTS
// ------------------------------------------------------------------
function MetricRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold ${color || "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

function TradeRowCard({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  const isWin = (trade.netPnl || 0) >= 0;

  const entryTime = getDateMillis(trade.entryDate);
  const exitTime = getDateMillis(trade.exitDate);
  const durationSeconds = exitTime && entryTime ? (exitTime - entryTime) / 1000 : 0;

  const holdStr = durationSeconds
    ? durationSeconds >= 86400
      ? `${Math.floor(durationSeconds / 86400)} DAYS`
      : durationSeconds >= 3600
        ? `${Math.floor(durationSeconds / 3600)} HR`
        : `${Math.ceil(durationSeconds / 60)} MIN`
    : "-";

  const qty = trade.plannedQuantity || 0;
  const entryPrice = trade.avgEntryPrice || 0;
  const exitPrice = trade.avgExitPrice || 0;
  const pnl = trade.netPnl || 0;

  let returnPercent = trade.returnPercent || 0;
  if (!returnPercent && entryPrice && qty) {
    const invested = entryPrice * qty;
    returnPercent = (pnl / invested) * 100;
  }

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl card-boundary p-4 hover:border-primary/20 transition-colors cursor-pointer"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="w-28 shrink-0">
          <p className="text-xs text-text-secondary">Date</p>
          <p className="text-sm font-medium text-foreground">
            {new Date(entryTime).toLocaleDateString()}
          </p>
        </div>
        <div className="w-20 shrink-0">
          <p className="text-xs text-text-secondary">Symbol</p>
          <p className="text-sm font-semibold text-primary">{trade.symbol}</p>
        </div>
        <div className="w-16 shrink-0">
          <p className="text-xs text-text-secondary">Status</p>
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isWin ? "bg-success/15 text-success" : "bg-loss/15 text-loss"
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWin ? "bg-success" : "bg-loss"}`} />
            {isWin ? "WIN" : "LOSS"}
          </span>
        </div>
        <div className="w-14 shrink-0">
          <p className="text-xs text-text-secondary">Side</p>
          <div className="flex items-center gap-1">
            {trade.direction?.toLowerCase() === "long" ? (
              <TrendingUp size={13} className="text-success" />
            ) : (
              <TrendingDown size={13} className="text-loss" />
            )}
            <span className="text-xs text-foreground capitalize">{trade.direction || "Long"}</span>
          </div>
        </div>
        <div className="w-24 shrink-0">
          <p className="text-xs text-text-secondary">Hold</p>
          {holdStr !== "-" ? (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{holdStr}</span>
          ) : (
            <span className="text-sm text-text-secondary">-</span>
          )}
        </div>
        <div className="w-28 shrink-0">
          <p className="text-xs text-text-secondary">Return</p>
          <p className={`text-sm font-bold ${isWin ? "text-success" : "text-loss"}`}>
            {isWin ? "+" : ""}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="w-20 shrink-0">
          <p className="text-xs text-text-secondary">Return %</p>
          <p className={`text-sm font-semibold ${isWin ? "text-success" : "text-loss"}`}>
            {returnPercent > 0 ? "+" : ""}{returnPercent.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 🚀 MAIN COMPONENT
// ------------------------------------------------------------------
export default function StrategyDetail({ strategy, onBack, onEdit, onDelete }: StrategyDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "trades">("details");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Local Pagination State
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  // Data Fetching
  const { trades, updateTrade, deleteTrade } = useTrades(strategy.accountId, strategy.userId);

  const strategyTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter(t => t.strategyId === strategy.id);
  }, [trades, strategy.id]);

  const sortedTrades = useMemo(() => {
    return [...strategyTrades].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "entryDate":
          comparison = getDateMillis(a.entryDate) - getDateMillis(b.entryDate);
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "pnl":
          comparison = (a.netPnl || 0) - (b.netPnl || 0);
          break;
        default:
          const valA = Number(a[sortField as keyof Trade]) || 0;
          const valB = Number(b[sortField as keyof Trade]) || 0;
          comparison = valA - valB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [strategyTrades, sortField, sortDirection]);

  const paginatedTrades = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, pageIndex, pageSize]);

  // Live Metrics Calculation
  const liveMetrics = useMemo(() => {
    const totalTrades = strategyTrades.length;
    if (totalTrades === 0) {
      return { totalTrades: 0, winRate: 0, totalPnl: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, expectancy: 0 };
    }

    const winners = strategyTrades.filter(t => (t.netPnl || 0) > 0);
    const losers = strategyTrades.filter(t => (t.netPnl || 0) <= 0);

    const totalPnl = strategyTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalWinPnl = winners.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalLossPnl = Math.abs(losers.reduce((sum, t) => sum + (t.netPnl || 0), 0));

    const winRate = (winners.length / totalTrades) * 100;
    const profitFactor = totalLossPnl === 0 ? (totalWinPnl > 0 ? 100 : 0) : (totalWinPnl / totalLossPnl);

    const avgWin = winners.length > 0 ? totalWinPnl / winners.length : 0;
    const avgLoss = losers.length > 0 ? (totalLossPnl * -1) / losers.length : 0;

    return { totalTrades, winRate, totalPnl, profitFactor: Math.min(profitFactor, 100), avgWin, avgLoss };
  }, [strategyTrades]);

  // Playbook Handlers
  const toggleGroup = (gId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(gId) ? next.delete(gId) : next.add(gId);
      return next;
    });
  };

  const ruleGroups = Array.isArray(strategy.rules) ? strategy.rules : [];
  const expandAll = () => {
    if (expandedGroups.size === ruleGroups.length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(ruleGroups.map((g: any) => g.id || g.name)));
    }
  };
  const allExpanded = ruleGroups.length > 0 && expandedGroups.size === ruleGroups.length;

  const statusStyles = (strategy as any).status === "paused"
    ? "bg-primary/12 text-primary"
    : "bg-success/12 text-success";

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Strategies
      </button>

      {/* Strategy Header */}
      <div className="bg-card rounded-2xl card-boundary p-6 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${strategy.color || '#3b82f6'}20` }}>
            {strategy.emoji || "🎯"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{strategy.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusStyles}`}>
                {(strategy as any).status || "active"}
              </span>
            </div>
            {strategy.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{strategy.description}</p>}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
              {strategy.style && (
                <span className="text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-lg capitalize">
                  {strategy.style.replace("_", " ")}
                </span>
              )}
              {strategy.assetClasses?.map(ac => (
                <span key={ac} className="text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-lg capitalize">{ac}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {(["details", "trades"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab === "trades" ? `Trades (${liveMetrics.totalTrades})` : "Strategy Detail"}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left: Metrics */}
          <div className="xl:col-span-2 space-y-4">
            {/* Win Rate Bar */}
            <div className="bg-card rounded-2xl card-boundary p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Win Rate</span>
                <span className={`text-lg font-bold tabular-nums ${liveMetrics.winRate >= 60 ? "text-success" : liveMetrics.winRate >= 40 ? "text-[hsl(38_92%_55%)]" : "text-loss"}`}>
                  {liveMetrics.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${liveMetrics.winRate}%`,
                    backgroundColor: liveMetrics.winRate >= 60 ? "hsl(var(--success))" : liveMetrics.winRate >= 40 ? "hsl(38 92% 55%)" : "hsl(var(--loss))",
                  }}
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-card rounded-2xl card-boundary p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <MetricRow
                  icon={DollarSign}
                  label="Net PnL"
                  value={`${liveMetrics.totalPnl >= 0 ? "+" : ""}${liveMetrics.totalPnl.toFixed(2)}`}
                  color={liveMetrics.totalPnl >= 0 ? "text-success" : "text-loss"}
                />
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow icon={Activity} label="Total Trades" value={String(liveMetrics.totalTrades)} />
                  <MetricRow icon={BarChart3} label="Profit Factor" value={liveMetrics.profitFactor.toFixed(2)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow icon={TrendingUp} label="Avg Winner" value={`+${liveMetrics.avgWin.toFixed(2)}`} color="text-success" />
                  <MetricRow icon={TrendingDown} label="Avg Loser" value={liveMetrics.avgLoss.toFixed(2)} color="text-loss" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Rule Groups */}
          <div className="xl:col-span-3">
            <div className="bg-card rounded-2xl card-boundary p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Strategy Playbook</h3>
                {ruleGroups.length > 0 && (
                  <button onClick={expandAll} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {allExpanded ? "Collapse All" : "Expand All"}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {ruleGroups.length > 0 ? (
                  ruleGroups.map((group: any, index: number) => {
                    const gId = group.id || group.name || `group-${index}`;
                    const isOpen = expandedGroups.has(gId);
                    const items = group.items || [];

                    return (
                      <div key={gId} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleGroup(gId)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{group.name}</span>
                            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                              {items.length} {items.length === 1 ? "rule" : "rules"}
                            </span>
                          </div>
                          {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                        </button>
                        {isOpen && items.length > 0 && (
                          <div className="border-t border-border px-4 py-3 space-y-2">
                            {items.map((item: any, i: number) => {
                              const isObj = typeof item === "object";
                              const checked = isObj ? item.checked : true;
                              const text = isObj ? item.text : item;

                              return (
                                <div key={isObj ? item.id : i} className="flex items-start gap-2.5">
                                  {checked ? (
                                    <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                                  ) : (
                                    <Circle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                                  )}
                                  <span className="text-sm text-foreground leading-relaxed">{text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isOpen && items.length === 0 && (
                          <div className="border-t border-border px-4 py-4">
                            <p className="text-xs text-muted-foreground italic">No rules defined yet</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                    No playbook rules configured for this strategy.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "trades" && (
        <div className="space-y-3">
          {paginatedTrades.length > 0 ? (
            paginatedTrades.map(trade => (
              <TradeRowCard key={trade.id} trade={trade} onClick={() => navigate(`/trades/${trade.id}`)} />
            ))
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Target size={40} className="text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-foreground font-semibold mb-1">No linked trades</p>
              <p className="text-sm text-muted-foreground">Trades using this strategy will appear here.</p>
            </div>
          )}

          {/* Pagination Footer */}
          {strategyTrades.length > 0 && (
            <div className="bg-card rounded-xl card-boundary p-4 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Rows per page</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0); }}>
                    <SelectTrigger className="w-20 h-8 text-xs bg-secondary/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">
                    {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, strategyTrades.length)} of {strategyTrades.length}
                  </span>
                  <button
                    onClick={() => setPageIndex(p => p - 1)}
                    disabled={pageIndex === 0}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                    {pageIndex + 1}
                  </span>
                  <button
                    onClick={() => setPageIndex(p => p + 1)}
                    disabled={(pageIndex + 1) * pageSize >= strategyTrades.length}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Modals Integration */}
      {tradeToEdit && (
        <EditTradeModal
          trade={tradeToEdit}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdateTrade={async (updates) => {
            await updateTrade({ trade: tradeToEdit, updates });
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}