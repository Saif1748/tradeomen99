import { Globe, Clock, ArrowsClockwise } from "@phosphor-icons/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageTitle from "@/components/dashboard/PageTitle";
import { useState } from "react";
import AddTradeModal from "@/components/trades/AddTradeModal";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import { Trade } from "@/lib/tradesData";
import { Strategy } from "@/lib/strategiesData";
import { toast } from "sonner";

const Markets = () => {
  const [addTradeOpen, setAddTradeOpen] = useState(false);
  const [addStrategyOpen, setAddStrategyOpen] = useState(false);

  const handleAddTrade = (newTrade: Omit<Trade, "id">) => {
    toast.success("Trade logged successfully!");
  };

  const handleCreateStrategy = (newStrategy: Omit<Strategy, 'id' | 'createdAt' | 'totalTrades' | 'winRate' | 'netPnl' | 'profitFactor' | 'expectancy' | 'avgWin' | 'avgLoss'>) => {
    toast.success("Strategy created successfully!");
  };

  const handleAddNote = () => {
    toast.info("Note feature coming soon!");
  };

  return (
    <DashboardLayout
      onAddTrade={() => setAddTradeOpen(true)}
      onAddStrategy={() => setAddStrategyOpen(true)}
      onAddNote={handleAddNote}
    >
      <PageTitle
        title="Markets"
        icon={<Globe weight="duotone" className="w-6 h-6 text-primary" />}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-2 flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 sm:p-12 rounded-2xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock weight="duotone" className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-3">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mb-6">
            Real-time market data, watchlists, and price alerts are on the way. Stay tuned for updates.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ArrowsClockwise weight="regular" className="w-4 h-4 animate-spin" />
            <span>In Development</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTradeModal
        open={addTradeOpen}
        onOpenChange={setAddTradeOpen}
        onAddTrade={handleAddTrade}
      />
      <CreateStrategyModal
        open={addStrategyOpen}
        onOpenChange={setAddStrategyOpen}
        onCreateStrategy={handleCreateStrategy}
      />
    </DashboardLayout>
  );
};

export default Markets;
