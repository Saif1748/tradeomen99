import { useState, useMemo } from "react";
import { Sword, FolderOpen } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import StrategyStatsCards from "@/components/strategies/StrategyStatsCards";
import StrategyCard from "@/components/strategies/StrategyCard";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import EditStrategyModal from "@/components/strategies/EditStrategyModal";
import StrategyDetail from "@/components/strategies/StrategyDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// --- Industry Grade Imports ---
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext"; 
import { useStrategies } from "@/hooks/useStrategies"; // ✅ Use the Hook
import { Strategy, TradingStyle } from "@/types/strategy";

// Constants
const STRATEGY_STYLES: TradingStyle[] = ["SCALP", "DAY_TRADE", "SWING", "POSITION", "INVESTMENT"];

const Strategies = () => {
  // removed useDashboard / PageHeader usage per request
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
  
  // Filters (removed search & style UI but keep state if needed later)
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");

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

  // Filter Logic (kept, but UI controls removed)
  const filteredStrategies = useMemo(() => {
    return strategies.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStyle = styleFilter === "all" || s.style === styleFilter;
      
      return matchesSearch && matchesStyle;
    });
  }, [strategies, searchQuery, styleFilter]);

  // Handlers
  const handleCreateStrategy = async (newStrategyData: any) => {
    try {
      await createStrategy(newStrategyData);
      setCreateModalOpen(false);
    } catch (error) {
      // Hook handles toasts; keep this to prevent modal auto-close on error
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
        <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 animate-in fade-in zoom-in-95 duration-200">
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

  // --- Render: List View (header removed, buttons removed, search/filter removed) ---
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        
        {/* Loading Skeleton for Stats */}
        {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
        ) : (
            <StrategyStatsCards
              totalStrategies={stats.totalStrategies}
              combinedTrades={stats.combinedTrades}
              avgWinRate={stats.avgWinRate}
              totalPnl={stats.totalPnl}
            />
        )}

        {/* Removed Search & Filter UI as requested */}

        {/* Strategy Cards Grid */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-xl" />)}
           </div>
        ) : filteredStrategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredStrategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onClick={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center border border-dashed border-border/60">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No strategies found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery || styleFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Create your first strategy to start tracking your edge."}
            </p>
            {!searchQuery && styleFilter === "all" && activeAccount && (
               <Button onClick={() => setCreateModalOpen(true)} className="glow-button text-white">
                 Create Strategy
               </Button>
            )}
          </div>
        )}
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
