import { useState } from "react";
import { ArrowLeft, PencilSimple, Trash, TrendUp, TrendDown, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Import the new hook
import { useStrategyTrades } from "@/hooks/use-strategies";

interface ExtendedStrategy {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  style?: string;
  instrument_types?: string[];
  rules?: Record<string, string[]>;
  netPnl: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
}

interface StrategyDetailProps {
  strategy: any; 
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const StrategyDetail = ({ strategy: data, onBack, onEdit, onDelete }: StrategyDetailProps) => {
  const strategy = data as ExtendedStrategy;
  const [activeTab, setActiveTab] = useState("rules");
  const { format, currency } = useCurrency();

  // --- 1. Fetch Linked Trades ---
  const { data: trades, isLoading: tradesLoading } = useStrategyTrades(strategy.id);

  // --- 2. Defensive Data Normalization ---
  const winRate = strategy.winRate ?? 0;
  const netPnl = strategy.netPnl ?? 0;
  const expectancy = strategy.expectancy ?? 0;
  const avgWin = strategy.avgWin ?? 0;
  const avgLoss = strategy.avgLoss ?? 0;

  const pnlColor = netPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const winRateColor = winRate >= 50 ? "text-emerald-400" : "text-rose-400";
  const expectancyColor = expectancy >= 0 ? "text-emerald-400" : "text-rose-400";

  const ruleEntries = strategy.rules ? Object.entries(strategy.rules) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
            <ArrowLeft weight="regular" className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{strategy.emoji || "♟️"}</span>
              <h1 className="text-2xl font-medium text-foreground tracking-tight-premium">
                {strategy.name}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mb-3">
              {strategy.description || "No description provided."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border text-foreground">
                {strategy.style || "General"}
              </Badge>
              {strategy.instrument_types?.map((instrument) => (
                <Badge key={instrument} variant="outline" className="border-border text-foreground">
                  {instrument}
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


      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
          <p className="text-2xl font-medium text-foreground">{strategy.totalTrades ?? 0}</p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
          <p className={`text-2xl font-medium ${winRateColor}`}>{winRate.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Net P&L ({currency})</p>
          <p className={`text-2xl font-medium ${pnlColor}`}>
            {netPnl >= 0 ? '+' : '-'}{format(Math.abs(netPnl))}
          </p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
          <p className="text-2xl font-medium text-foreground">
             {strategy.profitFactor >= 100 ? "100.00+" : (strategy.profitFactor ?? 0).toFixed(2)}
          </p>
        </div>
      </div>


      {/* Performance Metrics */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-medium text-foreground mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Expectancy</p>
            <p className={`text-xl font-medium ${expectancyColor}`}>
              {expectancy >= 0 ? '+' : '-'}{format(Math.abs(expectancy))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Winner</p>
            <div className="flex items-center gap-2">
              <TrendUp weight="regular" className="w-4 h-4 text-emerald-400" />
              <p className="text-xl font-medium text-emerald-400">
                +{format(Math.abs(avgWin))}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Loser</p>
            <div className="flex items-center gap-2">
              <TrendDown weight="regular" className="w-4 h-4 text-rose-400" />
              <p className="text-xl font-medium text-rose-400">
                -{format(Math.abs(avgLoss))}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="rules" className="flex-1 rounded-lg data-[state=active]:bg-card">Rules</TabsTrigger>
          <TabsTrigger value="trades" className="flex-1 rounded-lg data-[state=active]:bg-card">Trades</TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 rounded-lg data-[state=active]:bg-card">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {ruleEntries.length > 0 ? (
              ruleEntries.map(([categoryName, rules]) => (
                <div key={categoryName} className="glass-card p-5 rounded-xl">
                  <h3 className="font-medium text-foreground mb-3">{categoryName} Rules</h3>
                  <ul className="space-y-2">
                    {Array.isArray(rules) && rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl">No rules defined.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          {tradesLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : trades && trades.length > 0 ? (
            <div className="glass-card overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trades.map((trade: any) => (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                      <td className={`px-4 py-3 ${trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.direction}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] uppercase">{trade.status}</Badge></td>
                      <td className={`px-4 py-3 text-right font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.pnl >= 0 ? '+' : '-'}{format(Math.abs(trade.pnl))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center text-muted-foreground border border-dashed border-border">
              <div className="bg-secondary/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendUp className="w-6 h-6 opacity-50" />
              </div>
              <p className="font-medium text-foreground">No linked trades yet</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">Trades tagged with "{strategy.name}" will appear here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="glass-card p-12 rounded-xl text-center text-muted-foreground border border-dashed border-border relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Sparkle weight="fill" className="w-3 h-3" /> Coming Soon
              </Badge>
            </div>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Sparkle weight="duotone" className="w-6 h-6" />
            </div>
            <p className="font-medium text-foreground">AI Strategy Analysis</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">Personalized insights on your execution of "{strategy.name}" are on the way.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyDetail;