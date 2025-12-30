import { useState, useMemo } from "react";
import { Plus, Export } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Trade, generateMockTrades } from "@/lib/tradesData";
import TradesStatsCards from "@/components/trades/TradesStatsCards";
import TradesFilters from "@/components/trades/TradesFilters";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailSheet from "@/components/trades/TradeDetailSheet";
import AddTradeModal from "@/components/trades/AddTradeModal";
import EditTradeModal from "@/components/trades/EditTradeModal";
import { toast } from "sonner";

const Trades = () => {
  const [trades, setTrades] = useState<Trade[]>(generateMockTrades());
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-foreground tracking-tight-premium">
              Trades
            </h1>
            <p className="text-muted-foreground mt-1">
              Track, analyze, and manage your trading history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-secondary/50 border-border/50 hover:bg-secondary"
            >
              <Export weight="regular" className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="gap-2 glow-button text-white"
            >
              <Plus weight="bold" className="w-4 h-4" />
              Add Trade
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 space-y-6">
        {/* Stats Cards */}
        <TradesStatsCards trades={trades} />

        {/* Filters */}
        <TradesFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sideFilter={sideFilter}
          setSideFilter={setSideFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />

        {/* Table */}
        <TradesTable
          trades={filteredTrades}
          onTradeClick={handleTradeClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Trade Detail Sheet/Modal */}
      <TradeDetailSheet
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
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
