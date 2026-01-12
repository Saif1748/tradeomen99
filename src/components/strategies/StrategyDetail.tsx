import { useState } from "react";
import { ArrowLeft, PencilSimple, Trash, TrendUp, TrendDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

// Define the shape coming from the parent (Strategies.tsx)
interface ExtendedStrategy {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  style?: string;
  instrument_types?: string[]; // API field
  rules?: Record<string, string[]>; // API JSONB field
  
  // Stats passed from parent
  netPnl: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
}

interface StrategyDetailProps {
  strategy: any; // Using any or the interface above to be flexible with the parent casting
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const StrategyDetail = ({ strategy: data, onBack, onEdit, onDelete }: StrategyDetailProps) => {
  const strategy = data as ExtendedStrategy;
  const [activeTab, setActiveTab] = useState("rules");
  const { format, currency } = useCurrency();

  const pnlColor = strategy.netPnl >= 0 ? "text-emerald-400" : "text-rose-400";
  const winRateColor = strategy.winRate >= 50 ? "text-emerald-400" : "text-rose-400";

  // Convert rules object to array for rendering if it exists
  const ruleEntries = strategy.rules ? Object.entries(strategy.rules) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <p className="text-2xl font-medium text-foreground">{strategy.totalTrades}</p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
          <p className={`text-2xl font-medium ${winRateColor}`}>{strategy.winRate.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Net P&L ({currency})</p>
          <p className={`text-2xl font-medium ${pnlColor}`}>
            {strategy.netPnl >= 0 ? '+' : ''}{format(Math.abs(strategy.netPnl))}
          </p>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
          <p className="text-2xl font-medium text-foreground">{strategy.profitFactor.toFixed(2)}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-medium text-foreground mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Expectancy</p>
            <p className={`text-xl font-medium ${strategy.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {format(strategy.expectancy)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Winner</p>
            <div className="flex items-center gap-2">
              <TrendUp weight="regular" className="w-4 h-4 text-emerald-400" />
              <p className="text-xl font-medium text-emerald-400">
                +{format(strategy.avgWin)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Loser</p>
            <div className="flex items-center gap-2">
              <TrendDown weight="regular" className="w-4 h-4 text-rose-400" />
              <p className="text-xl font-medium text-rose-400">
                -{format(strategy.avgLoss)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="rules" className="flex-1 rounded-lg data-[state=active]:bg-card">
            Rules
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex-1 rounded-lg data-[state=active]:bg-card">
            Trades
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 rounded-lg data-[state=active]:bg-card">
            AI Insights
          </TabsTrigger>
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
                    {(!rules || rules.length === 0) && (
                      <li className="text-sm text-muted-foreground/50 italic">No rules defined</li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl">
                No rules defined for this strategy.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          <div className="glass-card p-6 rounded-xl text-center text-muted-foreground">
            <p>Trades using this strategy will appear here.</p>
            <p className="text-sm mt-1">Link trades to this strategy when creating or editing them.</p>
          </div>
        </TabsContent>

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