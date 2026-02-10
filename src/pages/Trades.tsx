import { useState, useMemo, useEffect } from "react";
import { Plus, Export, DotsThreeVertical, Funnel, CalendarBlank, ChartLineUp } from "@phosphor-icons/react";
import { useDashboard } from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// --- Industry Grade Imports ---
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // ✅ Workspace Context
import { getTrades, createTrade, updateTrade, deleteTrade } from "@/services/tradeService";
import { Trade } from "@/types/trade";

// Components
import TradesStatsCards from "@/components/trades/TradesStatsCards";
import TradesFilters from "@/components/trades/TradesFilters";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailSheet from "@/components/trades/TradeDetailSheet";
import AddTradeModal from "@/components/trades/AddTradeModal";
import EditTradeModal from "@/components/trades/EditTradeModal";

const Trades = () => {
  const { onMobileMenuOpen } = useDashboard();
  
  // ✅ 1. Consume Workspace Context
  const { activeAccount, isLoading: isWorkspaceLoading } = useWorkspace();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("entryDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // UI State
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // --- 2. Fetch Logic (Real Data) ---
  const fetchTrades = async () => {
    if (!activeAccount?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getTrades(activeAccount.id);
      setTrades(data);
    } catch (error) {
      console.error("Fetch trades error:", error);
      toast.error("Failed to load trades");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when workspace changes
  useEffect(() => {
    fetchTrades();
  }, [activeAccount?.id]);

  // --- 3. Filter & Sort Logic (Client Side) ---
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          (t.notes || "").toLowerCase().includes(query) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Side filter
    if (sideFilter !== "all") {
      result = result.filter((t) => t.direction === sideFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((t) => t.assetClass === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "entryDate":
          // Use .toMillis() if it's a Firestore Timestamp, fallback if Date
          const dateA = a.entryDate?.toMillis ? a.entryDate.toMillis() : new Date(a.entryDate).getTime();
          const dateB = b.entryDate?.toMillis ? b.entryDate.toMillis() : new Date(b.entryDate).getTime();
          comparison = dateA - dateB;
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "pnl":
          comparison = (a.netPnl || 0) - (b.netPnl || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [trades, searchQuery, sideFilter, typeFilter, sortField, sortDirection]);

  // --- 4. Handlers ---

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailOpen(true);
  };

  const handleAddTrade = async (newTradeData: any) => {
    if (!activeAccount || !auth.currentUser) return;
    try {
      await createTrade(activeAccount.id, auth.currentUser.uid, newTradeData);
      toast.success("Trade logged successfully");
      fetchTrades(); 
      setAddModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create trade");
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setDetailOpen(false);
    setEditModalOpen(true);
  };

  const handleUpdateTrade = async (updatedData: Partial<Trade>) => {
    if (!tradeToEdit || !activeAccount || !auth.currentUser) return;
    try {
      // ✅ Updated to pass userId for audit logging
      await updateTrade(tradeToEdit.id, activeAccount.id, auth.currentUser.uid, tradeToEdit, updatedData);
      toast.success("Trade updated successfully");
      fetchTrades();
      setEditModalOpen(false);
    } catch (e) {
      toast.error("Failed to update trade");
    }
  };

  const handleDeleteTrade = async (trade: Trade) => {
    if (!auth.currentUser) return;
    try {
      // ✅ Updated to pass userId for audit logging
      await deleteTrade(trade, auth.currentUser.uid); 
      toast.success("Trade deleted");
      setDetailOpen(false);
      fetchTrades();
    } catch (e) {
      toast.error("Failed to delete trade");
    }
  };

  const clearFilters = () => {
    setSideFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = sideFilter !== "all" || typeFilter !== "all";

  // --- Render ---
  return (
    <>
      <PageHeader
        title="Trades"
        icon={<ChartLineUp weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={onMobileMenuOpen}
      >
        {/* Desktop Header Actions */}
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
              disabled={isWorkspaceLoading || !activeAccount}
              className="gap-2 glow-button text-white"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Add Trade
            </Button>
        </div>

        {/* Mobile Header Actions */}
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
        
        {/* Loading State for Stats */}
        {isLoading || isWorkspaceLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
        ) : (
            <TradesStatsCards trades={trades} />
        )}

        {/* Filters - Desktop */}
        <div className="hidden sm:block">
          <TradesFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sideFilter={sideFilter}
            setSideFilter={setSideFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
          />
        </div>

        {/* Filters - Mobile */}
        <div className="sm:hidden glass-card p-3 rounded-xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-3 pr-3 text-sm bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterSheetOpen(true)}
              className={`gap-1.5 bg-secondary/50 border-border/50 ${hasActiveFilters ? 'text-primary border-primary/50' : ''}`}
            >
              <Funnel weight={hasActiveFilters ? "fill" : "regular"} className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading || isWorkspaceLoading ? (
            <div className="glass-card rounded-xl p-6 space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        ) : (
            <TradesTable
              trades={filteredTrades}
              onTradeClick={handleTradeClick}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground">Filters</SheetTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  Clear all
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Side</label>
              <Select value={sideFilter} onValueChange={setSideFilter}>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                  <SelectItem value="FOREX">Forex</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
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
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
      />

      {/* Add Modal */}
      <AddTradeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        accountId={activeAccount?.id} // ✅ Pass ID
        onSubmit={handleAddTrade}
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