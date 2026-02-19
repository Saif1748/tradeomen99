import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/types/trade";

// --- Components ---
// Removed: import TradesStatsCards from "@/components/trades/TradesStatsCards";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailModal from "@/components/trades/TradeDetailModal"; 
import EditTradeModal from "@/components/trades/EditTradeModal";

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
    // 1. Extract Params
    const q = (searchParams.get("q") || "").toLowerCase();
    const side = searchParams.get("side") || "all";
    const type = searchParams.get("type") || "all";
    const strategy = searchParams.get("strategy") || "all";
    const tag = searchParams.get("tags") || "all";
    const dateRange = searchParams.get("dateRange") || "30d";

    // 2. Calculate Date Cutoff
    const now = Date.now();
    let minDate = 0;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "7d": minDate = now - (7 * ONE_DAY); break;
      case "30d": minDate = now - (30 * ONE_DAY); break;
      case "90d": minDate = now - (90 * ONE_DAY); break;
      case "1y": minDate = now - (365 * ONE_DAY); break;
      case "all": minDate = 0; break;
      default: minDate = now - (30 * ONE_DAY); // Default 30d
    }

    // 3. Filter Data
    return trades.filter((t) => {
      // A. Text Search (Symbol, Notes, Tags)
      if (q) {
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesNotes = (t.notes || "").toLowerCase().includes(q);
        const matchesTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchesSymbol && !matchesNotes && !matchesTags) return false;
      }

      // B. Dropdown Filters
      if (side !== "all" && t.direction !== side) return false;
      if (type !== "all" && t.assetClass !== type) return false;
      if (strategy !== "all" && t.strategyId !== strategy) return false;
      if (tag !== "all" && !(t.tags || []).includes(tag)) return false;

      // C. Date Range
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

  const handleSort = useCallback((field: string) => {
    const validField = field as SortField;
    if (sortField === validField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(validField);
      setSortDirection("desc");
    }
  }, [sortField]);

  return {
    sortedTrades,
    sortField,
    sortDirection,
    handleSort
  };
};

// ------------------------------------------------------------------
// 🚀 MAIN COMPONENT
// ------------------------------------------------------------------
const Trades = () => {
  const { activeAccount } = useWorkspace();
  const userId = auth.currentUser?.uid;

  // ✅ 1. Fetch Data (with Pagination Props)
  const { 
    trades, 
    totalCount, // NEW
    isLoading, 
    updateTrade, 
    deleteTrade,
    // Pagination Controls
    pageIndex,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = useTrades(activeAccount?.id, userId);

  // ✅ 2. Filter Data (Using URL Params on current page)
  const filteredTrades = useTradeFilters(trades);

  // ✅ 3. Sort Data (Using Filtered Results)
  const { sortedTrades, sortField, sortDirection, handleSort } = useTradeSort(filteredTrades);

  // UI State
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  // --- Handlers ---
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

  // --- Render ---
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6 h-[calc(100vh-80px)] flex flex-col">
        
        {/* Main Table (Now takes full height and has pagination) */}
        <TradesTable
          trades={sortedTrades}
          onTradeClick={handleTradeClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          isLoading={isLoading}
          // Pagination Props Passed Down
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          nextPage={nextPage}
          prevPage={prevPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
        />
      </div>

      {/* Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditClick}
        onDelete={handleDeleteTrade}
      />

      {/* Edit Modal */}
      {tradeToEdit && (
        <EditTradeModal
          trade={tradeToEdit}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdateTrade={handleUpdateTrade}
        />
      )}
    </>
  );
};

export default Trades;