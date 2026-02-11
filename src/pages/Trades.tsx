import { useState, useCallback, useMemo } from "react";
import { 
  Plus, 
  Export, 
  DotsThreeVertical, 
  Funnel, 
  ChartLineUp 
} from "@phosphor-icons/react";
import { toast } from "sonner";

// --- Services & Context ---
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTrades } from "@/hooks/useTrades"; // ✅ Using the new Hook

// --- Types ---
import { Trade, AssetClass, TradeDirection } from "@/types/trade";

// --- Components ---
import PageHeader from "@/components/dashboard/PageHeader";
import { useDashboard } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TradesStatsCards from "@/components/trades/TradesStatsCards";
import TradesFilters from "@/components/trades/TradesFilters";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailSheet from "@/components/trades/TradeDetailSheet";
import AddTradeModal from "@/components/trades/AddTradeModal";
import EditTradeModal from "@/components/trades/EditTradeModal";

// ------------------------------------------------------------------
// 🔧 UTILITY HOOK: Filter & Sort Logic
// ------------------------------------------------------------------
type SortField = keyof Trade | "pnl";

const useTradeFilters = (trades: Trade[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<TradeDirection | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AssetClass | "all">("all");
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Helper: robust date parser for Firestore Timestamps vs Dates vs Strings
  const getDateMillis = useCallback((date: any): number => {
    if (!date) return 0;
    if (typeof date.toMillis === "function") return date.toMillis();
    if (date instanceof Date) return date.getTime();
    return new Date(date).getTime();
  }, []);

  const filteredTrades = useMemo(() => {
      let result = trades.filter((t) => {
        // 1. Text Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesSymbol = t.symbol.toLowerCase().includes(q);
          const matchesNotes = (t.notes || "").toLowerCase().includes(q);
          const matchesTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
          if (!matchesSymbol && !matchesNotes && !matchesTags) return false;
        }
        // 2. Side Filter
        if (sideFilter !== "all" && t.direction !== sideFilter) return false;
        // 3. Asset Type Filter
        if (typeFilter !== "all" && t.assetClass !== typeFilter) return false;
        
        return true;
      });

      // Sort Logic
      return result.sort((a, b) => {
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
  }, [trades, searchQuery, sideFilter, typeFilter, sortField, sortDirection, getDateMillis]);

  const handleSort = useCallback((field: string) => {
    const validField = field as SortField;
    if (sortField === validField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(validField);
      setSortDirection("desc");
    }
  }, [sortField]);

  const clearFilters = useCallback(() => {
    setSideFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  }, []);

  return {
    filteredTrades,
    searchQuery, setSearchQuery,
    sideFilter, setSideFilter,
    typeFilter, setTypeFilter,
    sortField, handleSort,
    sortDirection,
    clearFilters,
    hasActiveFilters: sideFilter !== "all" || typeFilter !== "all"
  };
};

// ------------------------------------------------------------------
// 🚀 MAIN COMPONENT
// ------------------------------------------------------------------
const Trades = () => {
  const { onMobileMenuOpen } = useDashboard();
  const { activeAccount } = useWorkspace();
  const userId = auth.currentUser?.uid;

  // ✅ 1. HOOK INTEGRATION: Fetching, Caching, & Optimistic Updates
  const { 
    trades, 
    isLoading, 
    createTrade, 
    updateTrade, 
    deleteTrade 
  } = useTrades(activeAccount?.id, userId);

  // UI State
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Filter Logic (Client-Side)
  const filters = useTradeFilters(trades);

  // --- Handlers ---

  const handleTradeClick = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setDetailOpen(true);
  }, []);

  const handleAddTrade = async (newTradeData: Partial<Trade>) => {
    try {
      // Hook handles the API call + Cache Update + Toast
      await createTrade(newTradeData);
      setAddModalOpen(false);
    } catch (e) {
      // Error toast is already handled in the hook
      console.error("Create failed", e);
    }
  };

  const handleEditClick = (trade: Trade) => {
    setTradeToEdit(trade);
    setDetailOpen(false); // Close detail sheet to focus on edit
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
      <PageHeader
        title="Trades"
        icon={<ChartLineUp weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={onMobileMenuOpen}
      >
        <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary"
              onClick={() => toast.info("Export feature coming soon")}
            >
              <Export weight="regular" className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setAddModalOpen(true)}
              disabled={isLoading || !activeAccount}
              className="gap-2 glow-button text-white"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Add Trade
            </Button>
        </div>

        <div className="sm:hidden flex gap-2">
            <Button 
                onClick={() => setAddModalOpen(true)} 
                size="sm"
                className="glow-button text-white"
            >
                <Plus weight="bold" className="w-4 h-4 mr-1" /> Add
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-secondary/50 border-border/50">
                  <DotsThreeVertical weight="bold" className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => toast.info("Export CSV...")}>
                  <Export weight="regular" className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        
        {/* Stats Cards */}
        {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
        ) : (
            <TradesStatsCards trades={trades} />
        )}

        {/* Desktop Filters */}
        <div className="hidden sm:block">
          <TradesFilters
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            sideFilter={filters.sideFilter}
            setSideFilter={filters.setSideFilter}
            typeFilter={filters.typeFilter}
            setTypeFilter={filters.setTypeFilter}
          />
        </div>

        {/* Mobile Filters Bar */}
        <div className="sm:hidden glass-card p-3 rounded-xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) => filters.setSearchQuery(e.target.value)}
                className="w-full h-9 pl-3 pr-3 text-sm bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterSheetOpen(true)}
              className={`gap-1.5 bg-secondary/50 border-border/50 ${filters.hasActiveFilters ? 'text-primary border-primary/50' : ''}`}
            >
              <Funnel weight={filters.hasActiveFilters ? "fill" : "regular"} className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Main Table */}
        {isLoading ? (
            <div className="glass-card rounded-xl p-6 space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        ) : (
            <TradesTable
              trades={filters.filteredTrades}
              onTradeClick={handleTradeClick}
              sortField={filters.sortField}
              sortDirection={filters.sortDirection}
              onSort={filters.handleSort}
            />
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground">Filters</SheetTitle>
              {filters.hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={filters.clearFilters} className="text-muted-foreground">
                  Clear all
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Side</label>
              <Select 
                value={filters.sideFilter} 
                onValueChange={(val) => filters.setSideFilter(val as TradeDirection | "all")}
              >
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Sides" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Sides</SelectItem>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select 
                value={filters.typeFilter} 
                onValueChange={(val) => filters.setTypeFilter(val as AssetClass | "all")}
              >
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                  <SelectItem value="FOREX">Forex</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="OPTIONS">Options</SelectItem>
                  <SelectItem value="INDEX">Index</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full glow-button text-white mt-4" 
              onClick={() => setFilterSheetOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <TradeDetailSheet
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditClick}
        onDelete={handleDeleteTrade}
      />

      {/* Modals */}
      <AddTradeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        accountId={activeAccount?.id}
        onSubmit={handleAddTrade}
      />

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