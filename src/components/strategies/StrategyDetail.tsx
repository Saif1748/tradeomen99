import { useState, useMemo } from "react";
import { ArrowLeft, PencilSimple, Trash, TrendUp, TrendDown, Wallet } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Strategy } from "@/types/strategy";
import { Trade } from "@/types/trade";

// Industry Grade Imports
import { useTrades } from "@/hooks/useTrades";
import TradesTable from "@/components/trades/TradesTable";
import TradeDetailModal from "@/components/trades/TradeDetailModal";
import EditTradeModal from "@/components/trades/EditTradeModal";

interface StrategyDetailProps {
  strategy: Strategy;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Sorting type definition
type SortField = keyof Trade | "pnl";

const StrategyDetail = ({ strategy, onBack, onEdit, onDelete }: StrategyDetailProps) => {
  const [activeTab, setActiveTab] = useState("rules");

  // --- Local UI State for Table & Pagination ---
  const [sortField, setSortField] = useState<SortField>("entryDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // --- Modal State ---
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  // 1. Fetch Trades
  const { 
    trades, 
    isLoading: isTradesLoading, 
    updateTrade, 
    deleteTrade 
  } = useTrades(strategy.accountId, strategy.userId);
  
  // 2. Filter Trades for this Strategy
  const strategyTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter(t => t.strategyId === strategy.id);
  }, [trades, strategy.id]);

  // 3. Sort Trades (Client-Side)
  const sortedTrades = useMemo(() => {
    return [...strategyTrades].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "entryDate":
          // Handle Firestore timestamps or Dates
          const aTime = (a.entryDate as any)?.toMillis ? (a.entryDate as any).toMillis() : new Date(a.entryDate as any).getTime();
          const bTime = (b.entryDate as any)?.toMillis ? (b.entryDate as any).toMillis() : new Date(b.entryDate as any).getTime();
          comparison = aTime - bTime;
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

  // 4. Paginate Trades (Client-Side) for the Table
  const paginatedTrades = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, pageIndex, pageSize]);

  // --- Handlers ---
  const handleSort = (field: string) => {
    const validField = field as SortField;
    if (sortField === validField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(validField);
      setSortDirection("desc");
    }
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailOpen(true);
  };

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

  // 5. Calculate ALL Metrics (Live Client-Side)
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

    const winRateDecimal = winners.length / totalTrades;
    const lossRateDecimal = losers.length / totalTrades;
    const expectancy = (winRateDecimal * avgWin) + (lossRateDecimal * avgLoss);

    return { 
      totalTrades, 
      winRate, 
      totalPnl, 
      profitFactor: Math.min(profitFactor, 100), 
      avgWin, 
      avgLoss, 
      expectancy 
    };
  }, [strategyTrades]);

  const ruleGroups = Array.isArray(strategy.rules) ? strategy.rules : [];
  const pnlColor = liveMetrics.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const winRateColor = liveMetrics.winRate >= 50 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
            <ArrowLeft weight="regular" className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{strategy.emoji || "⚡"}</span>
              <h1 className="text-2xl font-medium text-foreground tracking-tight-premium">
                {strategy.name}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mb-3">
              {strategy.description || "No description provided."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border text-foreground">
                {strategy.style?.replace("_", " ")}
              </Badge>
              {strategy.assetClasses?.map((asset) => (
                <Badge key={asset} variant="outline" className="border-border text-foreground">
                  {asset}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <PencilSimple weight="regular" className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete} className="hover:text-rose-400 hover:border-rose-400/50">
            <Trash weight="regular" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
          <p className="text-2xl font-medium text-foreground">
            {isTradesLoading ? <Skeleton className="h-8 w-12" /> : liveMetrics.totalTrades}
          </p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
          {isTradesLoading ? <Skeleton className="h-8 w-16" /> : (
            <p className={`text-2xl font-medium ${winRateColor}`}>{liveMetrics.winRate.toFixed(1)}%</p>
          )}
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Net P&L (USD)</p>
          {isTradesLoading ? <Skeleton className="h-8 w-24" /> : (
            <p className={`text-2xl font-medium ${pnlColor}`}>
              {liveMetrics.totalPnl >= 0 ? '+' : ''}${liveMetrics.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
          {isTradesLoading ? <Skeleton className="h-8 w-12" /> : (
            <p className="text-2xl font-medium text-foreground">
              {liveMetrics.profitFactor >= 100 ? "100+" : liveMetrics.profitFactor.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* --- Performance Metrics --- */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-medium text-foreground mb-4">Performance Metrics</h2>
        {isTradesLoading ? (
           <div className="grid grid-cols-3 gap-6">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-16 w-full" />
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expectancy / Trade</p>
              <p className={`text-xl font-medium ${liveMetrics.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${liveMetrics.expectancy.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Winner</p>
              <div className="flex items-center gap-2">
                <TrendUp weight="regular" className="w-4 h-4 text-emerald-400" />
                <p className="text-xl font-medium text-emerald-400">
                  +${liveMetrics.avgWin.toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Loser</p>
              <div className="flex items-center gap-2">
                <TrendDown weight="regular" className="w-4 h-4 text-rose-400" />
                <p className="text-xl font-medium text-rose-400">
                  ${liveMetrics.avgLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Tabs --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="rules" className="flex-1 rounded-lg data-[state=active]:bg-card">
            Rules
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex-1 rounded-lg data-[state=active]:bg-card">
            Trades {liveMetrics.totalTrades > 0 && `(${liveMetrics.totalTrades})`}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 rounded-lg data-[state=active]:bg-card">
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* 1. Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {ruleGroups.length > 0 ? (
              ruleGroups.map((group) => (
                <div key={group.id} className="glass-card p-5 rounded-xl">
                  <h3 className="font-medium text-foreground mb-3">{group.name}</h3>
                  <ul className="space-y-2">
                    {group.items && group.items.length > 0 ? (
                      group.items.map((rule, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground/50 italic">No rules defined</li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center p-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                No rules configured for this strategy.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. Trades Tab */}
        <TabsContent value="trades" className="mt-4">
          {isTradesLoading ? (
             <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
             </div>
          ) : strategyTrades.length > 0 ? (
             <div className="glass-card rounded-xl overflow-hidden border border-border/50">
               <TradesTable 
                 trades={paginatedTrades} 
                 onTradeClick={handleTradeClick}
                 sortField={sortField}
                 sortDirection={sortDirection}
                 onSort={handleSort}
                 isLoading={false}
                 
                 // ✅ Pass Pagination Props (Managed Locally for Strategy Subset)
                 totalCount={strategyTrades.length}
                 pageIndex={pageIndex}
                 pageSize={pageSize}
                 setPageSize={(size) => { setPageSize(size); setPageIndex(0); }}
                 nextPage={() => setPageIndex(p => p + 1)}
                 prevPage={() => setPageIndex(p => p - 1)}
                 hasNextPage={(pageIndex + 1) * pageSize < strategyTrades.length}
                 hasPrevPage={pageIndex > 0}
               />
             </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center text-muted-foreground flex flex-col items-center">
              <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-3">
                 <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No trades linked yet</p>
              <p className="text-sm mt-1">
                Link trades to <strong>{strategy.name}</strong> when creating or editing them to see them here.
              </p>
            </div>
          )}
        </TabsContent>

        {/* 3. AI Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <div className="glass-card p-6 rounded-xl text-center text-muted-foreground">
            <p>AI-powered insights and recommendations coming soon.</p>
            <p className="text-sm mt-1">Get personalized analysis of your strategy performance.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* ✅ Modals Integration */}
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
    </div>
  );
};

export default StrategyDetail;