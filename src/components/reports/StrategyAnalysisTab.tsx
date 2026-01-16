import { ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useCurrency } from "@/hooks/use-currency";
import { Skeleton } from "@/components/ui/skeleton";

interface StrategyAnalysisTabProps {
  data: any;
  isLoading: boolean;
  isError: boolean;
}

const StrategyAnalysisTab = ({ data, isLoading, isError }: StrategyAnalysisTabProps) => {
  const { format, symbol } = useCurrency();

  const formatCurrency = (val: number) => {
    return `${symbol}${format(val)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-xl bg-secondary/50" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-xl bg-secondary/50" />
          <Skeleton className="h-[280px] w-full rounded-xl bg-secondary/50" />
        </div>
      </div>
    );
  }

  // ✅ FIX: Strict Array Check
  // This prevents the "find is not a function" crash if the API returns an Object or Null
  const strategyData = Array.isArray(data) ? data : [];

  if (isError || !strategyData.length) {
    return (
      <div className="h-64 flex items-center justify-center glass-card rounded-2xl border border-rose-500/20 text-rose-400">
        {isError ? "Failed to load strategy performance data." : "No strategy data available for this period."}
      </div>
    );
  }

  // Logic to identify best/worst for UI highlighting
  // Safe access ensuring we don't crash on empty arrays
  const bestStrategy = strategyData[0]?.name || null;
  
  const worstProfitFactor = strategyData.length > 0 
    ? Math.min(...strategyData.map((s: any) => Number(s.profitFactor) || 0)) 
    : 0;
    
  const worstStrategy = strategyData.find((s: any) => (Number(s.profitFactor) || 0) === worstProfitFactor)?.name;

  return (
    <div className="space-y-6">
      {/* Strategy Comparison Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Strategy Performance Comparison</h3>
        <div className="glass-card rounded-xl overflow-hidden border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Strategy</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trades</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Win %</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Factor</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg P&L</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total P&L</th>
                  <th className="text-center p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Max DD</th>
                </tr>
              </thead>
              <tbody>
                {strategyData.map((strategy: any) => {
                  const isBest = strategy.name === bestStrategy;
                  const isWorst = strategy.name === worstStrategy && (Number(strategy.profitFactor) || 0) < 1;
                  const pnl = Number(strategy.totalPnl) || 0;
                  const pf = Number(strategy.profitFactor) || 0;
                  const winRate = Number(strategy.winRate) || 0;
                  const avgPnl = Number(strategy.avgPnl) || 0;
                  const maxDD = Number(strategy.maxDrawdown) || 0;
                  
                  return (
                    <tr key={strategy.name || Math.random()} className={`border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/10 ${isBest ? 'bg-emerald-500/5' : isWorst ? 'bg-rose-500/5' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold">{strategy.name || "Unknown"}</span>
                          {isBest && <ArrowUp weight="bold" className="w-3.5 h-3.5 text-emerald-400" />}
                          {isWorst && <ArrowDown weight="bold" className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                      </td>
                      <td className="p-4 text-center text-muted-foreground tabular-nums">{strategy.trades || 0}</td>
                      <td className="p-4 text-center tabular-nums">
                        <span className={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                          {winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center tabular-nums">
                        <span className={pf >= 1.5 ? 'text-emerald-400' : pf >= 1 ? 'text-foreground' : 'text-rose-400'}>
                          {pf.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center tabular-nums">
                        <span className={avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {avgPnl >= 0 ? "+" : ""}{formatCurrency(avgPnl)}
                        </span>
                      </td>
                      <td className="p-4 text-center tabular-nums font-medium">
                        <span className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                        </span>
                      </td>
                      <td className="p-4 text-center tabular-nums">
                        <span className={maxDD > 15 ? 'text-rose-400' : 'text-muted-foreground'}>
                          {maxDD.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avg P&L per Strategy Chart */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-6">Average P&L by Strategy</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.3} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(value) => `${symbol}${value}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} 
                  formatter={(value: number) => [formatCurrency(value), "Avg P&L"]} 
                />
                <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]} barSize={20}>
                  {strategyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(Number(entry.avgPnl) || 0) >= 0 ? "hsl(142, 71%, 45%)" : "hsl(346, 84%, 61%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total P&L by Strategy */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-6">Total P&L by Strategy</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${symbol}${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} 
                  formatter={(value: number) => [formatCurrency(value), "Total P&L"]} 
                />
                <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]} barSize={30}>
                  {strategyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(Number(entry.totalPnl) || 0) >= 0 ? "hsl(142, 71%, 45%)" : "hsl(346, 84%, 61%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysisTab;