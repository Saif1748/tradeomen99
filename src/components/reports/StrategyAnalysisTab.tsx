import { ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trade } from "@/lib/tradesData";
import { generateStrategyPerformance } from "@/lib/reportsData";

interface StrategyAnalysisTabProps {
  trades: Trade[];
}

const StrategyAnalysisTab = ({ trades }: StrategyAnalysisTabProps) => {
  const strategyData = generateStrategyPerformance(trades);
  const bestStrategy = strategyData[0]?.name;
  const worstProfitFactor = Math.min(...strategyData.map(s => s.profitFactor));
  const worstStrategy = strategyData.find(s => s.profitFactor === worstProfitFactor)?.name;

  return (
    <div className="space-y-6">
      {/* Strategy Comparison Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Strategy Performance Comparison</h3>
        <div className="glass-card rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-light text-muted-foreground">Strategy</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Trades</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Win %</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Profit Factor</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Avg P&L</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Total P&L</th>
                <th className="text-center p-4 text-xs font-light text-muted-foreground">Max DD</th>
              </tr>
            </thead>
            <tbody>
              {strategyData.map((strategy) => {
                const isBest = strategy.name === bestStrategy;
                const isWorst = strategy.name === worstStrategy && strategy.profitFactor < 1;
                return (
                  <tr key={strategy.name} className={`border-b border-border/50 last:border-0 transition-colors ${isBest ? 'bg-emerald-500/5' : isWorst ? 'bg-rose-500/5' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{strategy.name}</span>
                        {isBest && <ArrowUp weight="bold" className="w-3.5 h-3.5 text-emerald-400" />}
                        {isWorst && <ArrowDown weight="bold" className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">{strategy.trades}</td>
                    <td className="p-4 text-center"><span className={strategy.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{strategy.winRate.toFixed(1)}%</span></td>
                    <td className="p-4 text-center"><span className={strategy.profitFactor >= 1.5 ? 'text-emerald-400' : strategy.profitFactor >= 1 ? 'text-foreground' : 'text-rose-400'}>{strategy.profitFactor.toFixed(2)}</span></td>
                    <td className="p-4 text-center"><span className={strategy.avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${strategy.avgPnl.toFixed(0)}</span></td>
                    <td className="p-4 text-center"><span className={strategy.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${strategy.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span></td>
                    <td className="p-4 text-center"><span className={strategy.maxDrawdown > 15 ? 'text-rose-400' : 'text-muted-foreground'}>{strategy.maxDrawdown.toFixed(1)}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Avg P&L per Strategy Chart */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Average P&L by Strategy</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Avg P&L"]} />
              <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                {strategyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? "hsl(160 60% 45%)" : "hsl(0 70% 50%)"} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Total P&L by Strategy */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Total P&L by Strategy</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Total P&L"]} />
              <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                {strategyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? "hsl(160 60% 45%)" : "hsl(0 70% 50%)"} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysisTab;