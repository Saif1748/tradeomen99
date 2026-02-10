import { useState, useMemo, useEffect } from "react";
import { Plus, MagnifyingGlass, Funnel, Sword, ArrowClockwise, FolderOpen } from "@phosphor-icons/react";
import { useDashboard } from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// --- Industry Grade Imports ---
import { auth } from "@/lib/firebase";
import { useWorkspace } from "@/contexts/WorkspaceContext"; 
import { getStrategies, deleteStrategy, createStrategy, updateStrategy } from "@/services/strategyService";
import { Strategy, TradingStyle } from "@/types/strategy";

// Constants
const STRATEGY_STYLES: TradingStyle[] = ["SCALP", "DAY_TRADE", "SWING", "POSITION", "INVESTMENT"];

const Strategies = () => {
  const { onMobileMenuOpen } = useDashboard();
  
  // ✅ 1. Consume Workspace Context
  const { activeAccount, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");

  // --- 2. Fetch Logic (Scoped to Active Account) ---
  const fetchStrategies = async () => {
    // Wait for workspace to be ready
    if (!activeAccount?.id) return;
    
    try {
      setIsLoading(true);
      const data = await getStrategies(activeAccount.id);
      setStrategies(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load strategies");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when the active account changes
  useEffect(() => {
    fetchStrategies();
  }, [activeAccount?.id]); 

  // --- 3. Stats Calculation (Client Side) ---
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

  // --- 4. Filter Logic ---
  const filteredStrategies = useMemo(() => {
    return strategies.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStyle = styleFilter === "all" || s.style === styleFilter;
      
      return matchesSearch && matchesStyle;
    });
  }, [strategies, searchQuery, styleFilter]);

  // --- 5. Handlers ---

  const handleCreateStrategy = async (newStrategyData: any) => {
    if (!auth.currentUser || !activeAccount) return;
    try {
      // ✅ Create Scoped Strategy with Audit
      await createStrategy(activeAccount.id, auth.currentUser.uid, newStrategyData);
      toast.success("Strategy created successfully");
      fetchStrategies(); 
      setCreateModalOpen(false);
    } catch (error) {
      toast.error("Failed to create strategy");
    }
  };

  const handleUpdateStrategy = async (updatedData: Partial<Strategy>) => {
    if (!selectedStrategy || !activeAccount || !auth.currentUser) return;
    try {
      // ✅ Update with Audit: Pass activeAccount.id AND userId
      await updateStrategy(
        selectedStrategy.id, 
        activeAccount.id, 
        auth.currentUser.uid, 
        updatedData
      );
      
      toast.success("Strategy updated successfully");
      fetchStrategies();
      setSelectedStrategy(prev => prev ? { ...prev, ...updatedData } : null);
      setEditModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update strategy");
    }
  };

  const handleDeleteStrategy = async () => {
    if (!selectedStrategy || !auth.currentUser) return;
    try {
      // ✅ Delete with Audit: Pass the strategy object (for logs) and userId
      await deleteStrategy(selectedStrategy, auth.currentUser.uid);
      
      toast.success("Strategy deleted");
      fetchStrategies();
      setSelectedStrategy(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete strategy");
    }
  };

  // --- Render: Detail View ---
  if (selectedStrategy) {
    return (
      <>
        <PageHeader
          title="Strategy Detail"
          icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />}
          onMobileMenuOpen={onMobileMenuOpen}
        />
        <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4">
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

  // --- Render: List View ---
  return (
    <>
      <PageHeader
        title="Strategies"
        icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={onMobileMenuOpen}
      >
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={fetchStrategies} disabled={isLoading || isWorkspaceLoading}>
             <ArrowClockwise className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
           </Button>
           <Button 
             onClick={() => setCreateModalOpen(true)} 
             disabled={isWorkspaceLoading || !activeAccount}
             className="glow-button gap-2 text-white"
           >
             <Plus weight="bold" className="w-4 h-4" />
             <span className="hidden sm:inline">New Strategy</span>
             <span className="sm:hidden">New</span>
           </Button>
        </div>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        
        {/* Loading Skeleton for Stats */}
        {isLoading || isWorkspaceLoading ? (
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

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-border">
              <Funnel weight="regular" className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Styles" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Styles</SelectItem>
              {STRATEGY_STYLES.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Strategy Cards Grid */}
        {isLoading || isWorkspaceLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] w-full rounded-xl" />)}
           </div>
        ) : filteredStrategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredStrategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onClick={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 sm:p-12 rounded-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {searchQuery || styleFilter !== "all"
                ? "No strategies match your search."
                : "No strategies yet in this workspace."}
            </p>
            {!searchQuery && styleFilter === "all" && activeAccount && (
               <Button onClick={() => setCreateModalOpen(true)}>
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