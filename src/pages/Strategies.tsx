import { useState, useMemo } from "react";
import { 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  FolderOpen
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StrategyCard from "@/components/strategies/StrategyCard";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import EditStrategyModal from "@/components/strategies/EditStrategyModal";
import StrategyDetail from "@/components/strategies/StrategyDetail";
import { Skeleton } from "@/components/ui/skeleton";

// --- Industry Grade Imports ---
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext"; 
import { useStrategies } from "@/hooks/useStrategies";
import { Strategy, TradingStyle } from "@/types/strategy";

const Strategies = () => {
  const { activeAccount } = useWorkspace();
  const userId = auth.currentUser?.uid;
  
  // Hook integration
  const { 
    strategies, 
    isLoading, 
    createStrategy, 
    updateStrategy, 
    deleteStrategy,
  } = useStrategies(activeAccount?.id, userId);
  
  // UI State
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Stats Calculation (Memoized from Hook Data)
  const stats = useMemo(() => {
    const totalStrategies = strategies.length;
    const combinedTrades = strategies.reduce((acc, s) => acc + (s.metrics?.totalTrades || 0), 0);
    const totalPnl = strategies.reduce((acc, s) => acc + (s.metrics?.totalPnl || 0), 0);
    
    const activeStrategies = strategies.filter(s => (s.metrics?.totalTrades || 0) > 0);
    const avgWinRate = activeStrategies.length > 0
      ? activeStrategies.reduce((acc, s) => acc + (s.metrics?.winRate || 0), 0) / activeStrategies.length
      : 0;

    return { totalStrategies, combinedTrades, totalPnl, avgWinRate };
  }, [strategies]);

  // Handlers
  const handleCreateStrategy = async (newStrategyData: any) => {
    try {
      await createStrategy(newStrategyData);
      setCreateModalOpen(false);
    } catch (error) {
      console.error("create strategy failed", error);
    }
  };

  const handleUpdateStrategy = async (updatedData: Partial<Strategy>) => {
    if (!selectedStrategy) return;
    try {
      await updateStrategy({ id: selectedStrategy.id, updates: updatedData });
      setSelectedStrategy(prev => prev ? { ...prev, ...updatedData } : null);
      setEditModalOpen(false);
    } catch (error) {
      console.error("update strategy failed", error);
    }
  };

  const handleDeleteStrategy = async () => {
    if (!selectedStrategy) return;
    try {
      await deleteStrategy(selectedStrategy);
      setSelectedStrategy(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("delete strategy failed", error);
    }
  };

  // --- Render: Detail View ---
  if (selectedStrategy) {
    return (
      <>
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <StrategyDetail
            strategy={selectedStrategy}
            onBack={() => setSelectedStrategy(null)}
            onEdit={() => setEditModalOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        </div>

        <EditStrategyModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          strategy={selectedStrategy}
          onUpdateStrategy={handleUpdateStrategy}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedStrategy.name}"? 
                This action cannot be undone and will remove the tag from associated trades.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStrategy}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // --- Render: Main List View ---
  return (
    <>
      <div>
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Strategies</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track and manage your trading strategies</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Plus size={16} /> Add Strategy
          </button>
        </div>

        {/* Loading Skeleton for Stats OR Real Stats */}
        {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
               {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-2xl p-5 card-boundary">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Total PnL</p>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold tabular-nums ${stats.totalPnl >= 0 ? "text-success" : "text-loss"}`}>
                    {stats.totalPnl >= 0 ? "+" : ""}{stats.totalPnl.toFixed(2)}
                  </span>
                  {stats.totalPnl >= 0 ? <ArrowUpRight size={18} className="text-success mb-0.5" /> : <ArrowDownRight size={18} className="text-loss mb-0.5" />}
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 card-boundary">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Avg Win Rate</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{stats.avgWinRate.toFixed(1)}%</span>
                  <TrendingUp size={18} className="text-primary mb-0.5" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 card-boundary">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Total Trades</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{stats.combinedTrades}</span>
                  <Activity size={18} className="text-primary mb-0.5" />
                </div>
              </div>
            </div>
        )}

        {/* Strategy Cards Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Strategies</h2>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />)}
             </div>
          ) : strategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {strategies.map(strategy => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onClick={() => setSelectedStrategy(strategy)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card p-12 rounded-2xl text-center flex flex-col items-center border border-dashed border-border/60 card-boundary">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No strategies found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first strategy to start tracking your trading edge.
              </p>
              {activeAccount && (
                 <button 
                   onClick={() => setCreateModalOpen(true)} 
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  >
                   <Plus size={16} /> Create Strategy
                 </button>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateStrategyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateStrategy={handleCreateStrategy}
      />
    </>
  );
};

export default Strategies;