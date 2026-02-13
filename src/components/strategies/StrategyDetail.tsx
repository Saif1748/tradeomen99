import { useState, useMemo } from "react";
import { ArrowLeft, PencilSimple, Trash, TrendUp, TrendDown, Wallet } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Strategy } from "@/types/strategy";

// Industry Grade Imports
import { useTrades } from "@/hooks/useTrades";
import TradesTable from "@/components/trades/TradesTable";

interface StrategyDetailProps {
  strategy: Strategy;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const StrategyDetail = ({ strategy, onBack, onEdit, onDelete }: StrategyDetailProps) => {
  const [activeTab, setActiveTab] = useState("rules");

  // 1. Fetch & Filter Trades for this Strategy
  const { trades, isLoading: isTradesLoading } = useTrades(strategy.accountId, strategy.userId);
  
  const strategyTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter(t => t.strategyId === strategy.id);
  }, [trades, strategy.id]);

  // 2. Calculate ALL Metrics (Live Client-Side)
  // This replaces the stale 'strategy.metrics' from the DB
  const liveMetrics = useMemo(() => {
    const totalTrades = strategyTrades.length;
    
    if (totalTrades === 0) {
      return { 
        totalTrades: 0, 
        winRate: 0, 
        totalPnl: 0, 
        profitFactor: 0,
        avgWin: 0, 
        avgLoss: 0, 
        expectancy: 0 
      };
    }

    // Sort winners and losers using netPnl (consistent with types/trade.ts)
    const winners = strategyTrades.filter(t => (t.netPnl || 0) > 0);
    const losers = strategyTrades.filter(t => (t.netPnl || 0) <= 0);

    // Financials
    const totalPnl = strategyTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalWinPnl = winners.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalLossPnl = Math.abs(losers.reduce((sum, t) => sum + (t.netPnl || 0), 0)); // Absolute value for calculations

    // Core Metrics
    const winRate = (winners.length / totalTrades) * 100;
    const profitFactor = totalLossPnl === 0 ? totalWinPnl : (totalWinPnl / totalLossPnl); // Handle division by zero

    // Advanced Metrics
    const avgWin = winners.length > 0 ? totalWinPnl / winners.length : 0;
    const avgLoss = losers.length > 0 ? (totalLossPnl * -1) / losers.length : 0; // Return negative number for display

    // Expectancy = (Win% * AvgWin) - (Loss% * |AvgLoss|)
    const winRateDecimal = winners.length / totalTrades;
    const lossRateDecimal = losers.length / totalTrades;
    const expectancy = (winRateDecimal * avgWin) + (lossRateDecimal * avgLoss);

    return { 
      totalTrades, 
      winRate, 
      totalPnl, 
      profitFactor, 
      avgWin, 
      avgLoss, 
      expectancy 
    };
  }, [strategyTrades]);

  // Safe Access to Rules
  const ruleGroups = Array.isArray(strategy.rules) ? strategy.rules : [];
  
  // Dynamic Styling based on Live Metrics
  const pnlColor = liveMetrics.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const winRateColor = liveMetrics.winRate >= 50 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mt-1"
          >
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

      {/* --- Stats Cards (Live Data) --- */}
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
              {liveMetrics.profitFactor >= 999 ? "∞" : liveMetrics.profitFactor.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* --- Performance Metrics (Live Data) --- */}
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

        {/* 2. Trades Tab (Linked Trades) */}
        <TabsContent value="trades" className="mt-4">
          {isTradesLoading ? (
             <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
             </div>
          ) : strategyTrades.length > 0 ? (
             <div className="glass-card rounded-xl overflow-hidden border border-border/50">
               <TradesTable 
                 trades={strategyTrades} 
                 isLoading={false} 
                 onEdit={() => {}} // Read-only in strategy view or pass handlers
                 onDelete={() => {}}
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
    </div>
  );
};

export default StrategyDetail;