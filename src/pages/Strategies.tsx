import { useState, useMemo } from "react";
import { Plus, MagnifyingGlass, Funnel, Sword } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
import { Strategy, calculateStrategyStats, strategyStyles } from "@/lib/strategiesData";
import { toast } from "sonner";

// ✅ Hooks & Context
import { useStrategies, UIStrategy } from "@/hooks/use-strategies";
import { useAuth } from "@/hooks/use-Auth";
import { useModal } from "@/contexts/ModalContext"; 
import { Skeleton } from "@/components/ui/skeleton";

const Strategies = () => {
  // --- 1. Real Data Hooks ---
  const { strategies: realStrategies, isLoading, createStrategy, updateStrategy, deleteStrategy } = useStrategies();
  const { profile } = useAuth();
  const { openUpgradeModal } = useModal();

  // --- 2. State ---
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- 3. Data Adapter (API -> UI) ---
  // We create a "Hybrid" object that satisfies both the Legacy UI components
  // and the new EditModal which might expect backend fields.
  const strategies: Strategy[] = useMemo(() => {
    return realStrategies.map((s: UIStrategy) => {
      // Map Backend Rules (Object) -> UI Rules (Array of Groups)
      const ruleGroups = s.rules 
        ? Object.entries(s.rules).map(([name, rules], i) => ({
            id: `g-${i}`,
            name,
            rules
          }))
        : [];

      const mapped = {
        id: s.id,
        name: s.name,
        description: s.description,
        
        // UI uses 'icon', Backend uses 'emoji'
        icon: s.emoji, 
        emoji: s.emoji, // Keep both for compatibility
        
        color: s.color,
        color_hex: s.color, // Keep both
        
        style: s.style,
        
        // UI uses 'instruments', Backend uses 'instrumentTypes'
        instruments: s.instrumentTypes || [],
        instrument_types: s.instrumentTypes, // For EditModal
        
        // UI uses 'ruleGroups', Backend uses 'rules' object
        ruleGroups: ruleGroups,
        rules: s.rules, // For EditModal
        
        track_missed_trades: s.trackMissed,
        createdAt: s.createdAt.toISOString(),
        
        // Mock/Placeholder Stats for UI visualization
        totalTrades: Math.floor(Math.random() * 50),
        winRate: Math.floor(Math.random() * 100),
        netPnl: Math.floor(Math.random() * 5000) - 1000,
        profitFactor: (Math.random() * 2 + 0.5),
        expectancy: Math.random() * 100,
        avgWin: 200,
        avgLoss: 100
      };
      
      return mapped as unknown as Strategy;
    });
  }, [realStrategies]);

  const stats = useMemo(() => calculateStrategyStats(strategies), [strategies]);

  const filteredStrategies = useMemo(() => {
    return strategies.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = styleFilter === "all" || s.style === styleFilter;
      return matchesSearch && matchesStyle;
    });
  }, [strategies, searchQuery, styleFilter]);

  // --- 4. Handlers (Connected to API) ---

  const handleCreateClick = () => {
    const plan = profile?.plan_tier || "FREE";
    const limit = (plan === "PRO" || plan === "PREMIUM") ? 1000 : 1;

    if (strategies.length >= limit) {
      openUpgradeModal(`Free plan is limited to ${limit} strategy. Upgrade for unlimited.`);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateStrategy = (newStrategy: any) => {
    // Map UI form fields to API payload
    const payload = {
        ...newStrategy,
        emoji: newStrategy.icon, // UI returns icon, API needs emoji
        color: newStrategy.color || "#FFFFFF",
        instrumentTypes: newStrategy.instruments, // UI returns instruments
        trackMissed: false
    };

    createStrategy(payload, {
        onSuccess: () => {
            setCreateModalOpen(false);
        }
    });
  };

  const handleUpdateStrategy = (updatedStrategy: Strategy) => {
    // The EditModal now handles the transformation, so we just pass the ID and the raw data structure
    // But since we are using the hook inside the modal, we just need to trigger the refresh here if needed
    // or simply update local state. 
    // Actually, react-query invalidation in the hook will auto-update 'strategies',
    // so we just need to update the selectedStrategy view.
    
    // We fetch the fresh object from the updated list to keep 'selectedStrategy' in sync
    // This is handled by the hook's onSuccess usually, but here we can just update the view
    // assuming the modal handles the mutation.
    
    setSelectedStrategy(updatedStrategy);
  };

  const handleDeleteStrategy = () => {
    if (!selectedStrategy) return;
    deleteStrategy(selectedStrategy.id, {
        onSuccess: () => {
            setSelectedStrategy(null);
            setDeleteDialogOpen(false);
        }
    });
  };

  // --- 5. Render ---

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader 
            title="Strategies" 
            icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />} 
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  // Detail View
  if (selectedStrategy) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Strategy Detail"
          icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedStrategy.name}"? This action cannot be undone.
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
      </DashboardLayout>
    );
  }

  // Main List View
  return (
    <DashboardLayout>
      <PageHeader
        title="Strategies"
        icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      >
        <Button onClick={handleCreateClick} className="glow-button gap-2 text-white">
          <Plus weight="bold" className="w-4 h-4" />
          <span className="hidden sm:inline">New Strategy</span>
          <span className="sm:hidden">New</span>
        </Button>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <StrategyStatsCards
          totalStrategies={stats.totalStrategies}
          combinedTrades={stats.combinedTrades}
          avgWinRate={stats.avgWinRate}
          totalPnl={stats.totalPnl}
        />

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
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              {strategyStyles.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Strategy Cards Grid */}
        {filteredStrategies.length > 0 ? (
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
          <div className="glass-card p-8 sm:p-12 rounded-2xl text-center">
            <p className="text-muted-foreground">
              {searchQuery || styleFilter !== "all"
                ? "No strategies match your search."
                : "No strategies yet. Create your first strategy to get started."}
            </p>
          </div>
        )}
      </div>

      <CreateStrategyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateStrategy={handleCreateStrategy}
      />
    </DashboardLayout>
  );
};

export default Strategies;