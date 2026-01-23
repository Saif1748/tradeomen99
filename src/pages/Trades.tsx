import { useState, useMemo } from "react";
import { Plus, Export, DotsThreeVertical, Funnel, X, CalendarBlank, ChartLineUp } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Trade, generateMockTrades } from "@/lib/tradesData";
import TradesStatsCards from "@/components/trades/TradesStatsCards";
import TradesFilters from "@/components/trades/TradesFilters";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailSheet from "@/components/trades/TradeDetailSheet";
import AddTradeModal from "@/components/trades/AddTradeModal";
import EditTradeModal from "@/components/trades/EditTradeModal";
import { toast } from "sonner";
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

const Trades = () => {
  const [trades, setTrades] = useState<Trade[]>(generateMockTrades());
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          t.notes.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Side filter
    if (sideFilter !== "all") {
      result = result.filter((t) => t.side === sideFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "side":
          comparison = a.side.localeCompare(b.side);
          break;
        case "pnl":
          comparison = a.pnl - b.pnl;
          break;
        case "rMultiple":
          comparison = a.rMultiple - b.rMultiple;
          break;
        case "strategy":
          comparison = a.strategy.localeCompare(b.strategy);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [trades, searchQuery, sideFilter, typeFilter, sortField, sortDirection]);

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

  const handleAddTrade = (newTrade: Omit<Trade, "id">) => {
    const trade: Trade = {
      ...newTrade,
      id: Date.now().toString(),
    };
    setTrades([trade, ...trades]);
    toast.success("Trade logged successfully!");
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setDetailOpen(false);
    setEditModalOpen(true);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
    toast.success("Trade updated successfully!");
  };

  const handleDeleteTrade = (trade: Trade) => {
    setTrades(trades.filter((t) => t.id !== trade.id));
    setDetailOpen(false);
    toast.success("Trade deleted successfully!");
  };

  const clearFilters = () => {
    setSideFilter("all");
    setTypeFilter("all");
  };

  const hasActiveFilters = sideFilter !== "all" || typeFilter !== "all";

  return (
    <DashboardLayout>
      <PageHeader
        title="Trades"
        icon={<ChartLineUp weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      >
        {/* Desktop: Export + Add Trade */}
        <Button
          variant="outline"
          className="hidden sm:flex gap-2 bg-secondary/50 border-border/50 hover:bg-secondary"
          onClick={() => toast.success("Exporting...")}
        >
          <Export weight="regular" className="w-4 h-4" />
          Export
        </Button>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 glow-button text-white"
        >
          <Plus weight="bold" className="w-4 h-4" />
          <span className="hidden sm:inline">Add Trade</span>
          <span className="sm:hidden">Add</span>
        </Button>
        {/* Mobile: Overflow menu for Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="sm:hidden bg-secondary/50 border-border/50">
              <DotsThreeVertical weight="bold" className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem onClick={() => toast.success("Exporting CSV...")}>
              <Export weight="regular" className="w-4 h-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Exporting PDF...")}>
              <Export weight="regular" className="w-4 h-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <TradesStatsCards trades={trades} />

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

        {/* Filters - Mobile: Compact search + filter button */}
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
              {hasActiveFilters && (
                <span className="ml-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {(sideFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Table */}
        <TradesTable
          trades={filteredTrades}
          onTradeClick={handleTradeClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Mobile FAB for Add Trade */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full glow-button text-white shadow-lg flex items-center justify-center z-40"
      >
        <Plus weight="bold" className="w-6 h-6" />
      </button>

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
            {/* Date Range Placeholder */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Date Range</label>
              <Button variant="outline" className="w-full justify-start gap-2 bg-secondary/50 border-border/50">
                <CalendarBlank weight="regular" className="w-4 h-4" />
                This Month
              </Button>
            </div>
            
            {/* Side Filter */}
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

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="Forex">Forex</SelectItem>
                  <SelectItem value="Futures">Futures</SelectItem>
                  <SelectItem value="Options">Options</SelectItem>
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

      {/* Trade Detail Sheet/Modal */}
      <TradeDetailSheet
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
        allTrades={trades}
      />

      {/* Add Trade Modal */}
      <AddTradeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAddTrade={handleAddTrade}
      />

      {/* Edit Trade Modal */}
      <EditTradeModal
        trade={tradeToEdit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdateTrade={handleUpdateTrade}
      />
    </DashboardLayout>
  );
};

export default Trades;
