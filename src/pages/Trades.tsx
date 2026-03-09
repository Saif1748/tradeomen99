import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/types/trade";
import {
  Table2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  SlidersHorizontal,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Target,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Components ---
import TradeDetailModal from "@/components/trades/TradeDetailModal"; 
import EditTradeModal from "@/components/trades/EditTradeModal";
import AddTradeModal, { TradeSubmissionPayload } from "@/components/trades/AddTradeModal";

// ------------------------------------------------------------------
// 🔧 UTILITY: Date Parsing
// ------------------------------------------------------------------
const getDateMillis = (date: any): number => {
  if (!date) return 0;
  if (typeof date.toMillis === "function") return date.toMillis();
  if (date instanceof Date) return date.getTime();
  return new Date(date).getTime();
};

// ------------------------------------------------------------------
// 🔍 UTILITY HOOK: Filtering Logic (Reads from URL)
// ------------------------------------------------------------------
const useTradeFilters = (trades: Trade[]) => {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const q = (searchParams.get("q") || "").toLowerCase();
    const side = searchParams.get("side") || "all";
    const type = searchParams.get("type") || "all";
    const strategy = searchParams.get("strategy") || "all";
    const tag = searchParams.get("tags") || "all";
    const dateRange = searchParams.get("dateRange") || "all";

    const now = Date.now();
    let minDate = 0;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "7d": minDate = now - (7 * ONE_DAY); break;
      case "30d": minDate = now - (30 * ONE_DAY); break;
      case "90d": minDate = now - (90 * ONE_DAY); break;
      case "1y": minDate = now - (365 * ONE_DAY); break;
      case "all": minDate = 0; break;
      default: minDate = 0;
    }

    return trades.filter((t) => {
      if (q) {
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesNotes = (t.notes || "").toLowerCase().includes(q);
        const matchesTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchesSymbol && !matchesNotes && !matchesTags) return false;
      }
      if (side !== "all" && t.direction !== side) return false;
      if (type !== "all" && t.assetClass !== type) return false;
      if (strategy !== "all" && t.strategyId !== strategy) return false;
      if (tag !== "all" && !(t.tags || []).includes(tag)) return false;
      if (minDate > 0) {
        const tradeDate = getDateMillis(t.entryDate);
        if (tradeDate < minDate) return false;
      }
      return true;
    });
  }, [trades, searchParams]);
};

// ------------------------------------------------------------------
// 🔧 UTILITY HOOK: Sorting Logic
// ------------------------------------------------------------------
type SortField = keyof Trade | "pnl";

const useTradeSort = (trades: Trade[]) => {
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
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
  }, [trades, sortField, sortDirection]);

  return { sortedTrades };
};

// ------------------------------------------------------------------
// 🎨 UI COMPONENTS (Matched exactly to visual-canvas)
// ------------------------------------------------------------------
function TradeMetricCard({ icon: Icon, iconBg, title, subtitle, value, valueColor }: {
  icon: React.ElementType; iconBg: string; title: string; subtitle: string; value: string; valueColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-5 card-boundary flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-inherit" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-text-secondary">{subtitle}</p>
        <p className={`text-lg font-bold mt-0.5 ${valueColor || "text-foreground"}`}>{value}</p>
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

  const qty = trade.quantity || trade.plannedQuantity || 0;
  const entryPrice = trade.entryPrice || trade.avgEntryPrice || 0;
  const exitPrice = trade.exitPrice || trade.avgExitPrice || 0;
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
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              isWin ? "bg-success/15 text-success" : "bg-loss/15 text-loss"
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
        <div className="w-12 shrink-0">
          <p className="text-xs text-text-secondary">Qty</p>
          <p className="text-sm text-foreground">{qty}</p>
        </div>
        <div className="w-24 shrink-0">
          <p className="text-xs text-text-secondary">Entry</p>
          <p className="text-sm text-foreground">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="w-24 shrink-0">
          <p className="text-xs text-text-secondary">Exit</p>
          <p className="text-sm text-foreground">{exitPrice ? `$${exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}</p>
        </div>
        <div className="w-20 shrink-0">
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
const Trades = () => {
  const { activeAccount } = useWorkspace();
  const userId = auth.currentUser?.uid;
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ 1. Fetch Data
  const { 
    trades, 
    totalCount, 
    isLoading, 
    createTrade,
    updateTrade, 
    deleteTrade,
    pageIndex,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = useTrades(activeAccount?.id, userId);

  // ✅ 2. Filter & Sort Data
  const filteredTrades = useTradeFilters(trades);
  const { sortedTrades } = useTradeSort(filteredTrades);

  // Stats Calculations
  const wins = filteredTrades.filter((t) => (t.netPnl || 0) >= 0);
  const losses = filteredTrades.filter((t) => (t.netPnl || 0) < 0);
  const totalVolume = filteredTrades.reduce((s, t) => s + (t.quantity || t.plannedQuantity || 0), 0);
  const winRate = filteredTrades.length > 0 ? ((wins.length / filteredTrades.length) * 100).toFixed(1) : "0";
  const netPnl = filteredTrades.reduce((s, t) => s + (t.netPnl || 0), 0);

  // UI State
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // --- Handlers ---
  const handleSearch = (val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev.toString());
      if (val) next.set("q", val);
      else next.delete("q");
      return next;
    });
  };

  const handleTradeClick = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setDetailOpen(true);
  }, []);

  const handleEditClick = (trade: Trade) => {
    setTradeToEdit(trade);
    setDetailOpen(false);
    setEditModalOpen(true);
  };

  const handleUpdateTrade = async (updatedData: Partial<Trade>) => {
    if (!tradeToEdit) return;
    try {
      await updateTrade({ trade: tradeToEdit, updates: updatedData });
      setEditModalOpen(false);
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDeleteTrade = async (trade: Trade) => {
    try {
      await deleteTrade(trade);
      setDetailOpen(false);
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleCreateTrade = async (data: TradeSubmissionPayload) => {
    if (createTrade) {
      await createTrade(data);
      setAddModalOpen(false);
    }
  };

  return (
    <>
      <div>
        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Table2 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Trades</h1>
              <p className="text-sm text-muted-foreground mt-0.5">View and manage your trades</p>
            </div>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 w-full sm:w-auto"
          >
            <Plus size={16} /> Add Trade
          </button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <TradeMetricCard icon={BarChart3} iconBg="bg-primary/15 text-primary" title="Volume" subtitle={`${filteredTrades.length} trades`} value={totalVolume.toString()} />
          <TradeMetricCard icon={TrendingUp} iconBg="bg-success/15 text-success" title="WIN" subtitle={`${wins.length} trades`} value={wins.reduce((s, t) => s + (t.netPnl || 0), 0).toLocaleString()} valueColor="text-success" />
          <TradeMetricCard icon={TrendingDown} iconBg="bg-loss/15 text-loss" title="LOSS" subtitle={`${losses.length} trades`} value={Math.abs(losses.reduce((s, t) => s + (t.netPnl || 0), 0)).toLocaleString()} valueColor="text-loss" />
          <TradeMetricCard icon={Target} iconBg="bg-primary/15 text-primary" title="Win Rate" subtitle={`${wins.length} Win`} value={`${winRate}%`} />
          <TradeMetricCard icon={DollarSign} iconBg={netPnl >= 0 ? "bg-success/15 text-success" : "bg-loss/15 text-loss"} title="Net PnL" subtitle={`${filteredTrades.length} trades`} value={`${netPnl >= 0 ? "" : "-"}$${Math.abs(netPnl).toLocaleString()}`} valueColor={netPnl >= 0 ? "text-success" : "text-loss"} />
        </div>

        {/* Toolbar */}
        <div className="bg-card rounded-xl card-boundary p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary/60 hover:text-foreground transition-colors">
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Columns</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary/60 hover:text-foreground transition-colors">
                <Filter size={15} />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-secondary/60 hover:text-foreground transition-colors">
                <Download size={15} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search..."
                value={searchParams.get("q") || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-secondary/40 border border-border text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/40 w-full sm:w-64 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Trade rows */}
        <div className="space-y-3 mb-6">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading trades...</div>
          ) : sortedTrades.length > 0 ? (
            sortedTrades.map((trade) => (
              <TradeRowCard
                key={trade.id}
                trade={trade}
                onClick={() => handleTradeClick(trade)}
              />
            ))
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Table2 size={40} className="text-muted-foreground mb-4 opacity-40" />
              <p className="text-foreground font-semibold mb-1">No trades found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

        {/* Pagination using Firebase hook props */}
        {!isLoading && filteredTrades.length > 0 && (
          <div className="bg-card rounded-xl card-boundary p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Rows per page</span>
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-20 h-8 text-xs bg-secondary/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">
                  {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}
                </span>
                <button 
                  onClick={prevPage} 
                  disabled={!hasPrevPage} 
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                  {pageIndex + 1}
                </span>
                <button 
                  onClick={nextPage} 
                  disabled={!hasNextPage} 
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TradeDetailModal
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditClick}
        onDelete={handleDeleteTrade}
      />

      {tradeToEdit && (
        <EditTradeModal
          trade={tradeToEdit}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdateTrade={handleUpdateTrade}
        />
      )}

      <AddTradeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        accountId={activeAccount?.id}
        onSubmit={handleCreateTrade}
      />
    </>
  );
};

export default Trades;