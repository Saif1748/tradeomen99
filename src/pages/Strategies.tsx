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
import { Strategy, generateMockStrategies, calculateStrategyStats, strategyStyles } from "@/lib/strategiesData";
import { toast } from "sonner";

const Strategies = () => {
  const [strategies, setStrategies] = useState<Strategy[]>(generateMockStrategies());
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = useMemo(() => calculateStrategyStats(strategies), [strategies]);

  const filteredStrategies = useMemo(() => {
    return strategies.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = styleFilter === "all" || s.style === styleFilter;
      return matchesSearch && matchesStyle;
    });
  }, [strategies, searchQuery, styleFilter]);

  const handleCreateStrategy = (newStrategy: Omit<Strategy, 'id' | 'createdAt' | 'totalTrades' | 'winRate' | 'netPnl' | 'profitFactor' | 'expectancy' | 'avgWin' | 'avgLoss'>) => {
    const strategy: Strategy = {
      ...newStrategy,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      profitFactor: 0,
      expectancy: 0,
      avgWin: 0,
      avgLoss: 0
    };
    setStrategies(prev => [...prev, strategy]);
    toast.success("Strategy created successfully");
  };

  const handleUpdateStrategy = (updatedStrategy: Strategy) => {
    setStrategies(prev =>
      prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s)
    );
    setSelectedStrategy(updatedStrategy);
    toast.success("Strategy updated successfully");
  };

  const handleDeleteStrategy = () => {
    if (!selectedStrategy) return;
    setStrategies(prev => prev.filter(s => s.id !== selectedStrategy.id));
    setSelectedStrategy(null);
    setDeleteDialogOpen(false);
    toast.success("Strategy deleted");
  };

  // Show detail view if a strategy is selected
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Strategies"
        icon={<Sword weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      >
        <Button onClick={() => setCreateModalOpen(true)} className="glow-button gap-2 text-white">
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
