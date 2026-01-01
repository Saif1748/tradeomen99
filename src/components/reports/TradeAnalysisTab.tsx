import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Trade } from "@/lib/tradesData";
import {
  generateScatterData,
  generatePnLDistribution,
  generateHoldingTimeData,
  getBestWorstTrades,
  generateAIInsights,
} from "@/lib/reportsData";
import AIInsightBanner from "./AIInsightBanner";
import { format } from "date-fns";

interface TradeAnalysisTabProps {
  trades: Trade[];
}

const TradeAnalysisTab = ({ trades }: TradeAnalysisTabProps) => {
  const scatterData = generateScatterData(trades);
  const pnlDistribution = generatePnLDistribution(trades);
  const holdingTimeData = generateHoldingTimeData(trades);
  const { best, worst } = getBestWorstTrades(trades, 5);
  const insight = generateAIInsights(trades, "tradeAnalysis");

  return (
    <div className="space-y-6">
      {/* AI Insight */}
      <AIInsightBanner insight={insight} />

      {/* Scatter Plot */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">R-Multiple vs P&L</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="rMultiple"
                name="R-Multiple"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                label={{ value: 'R-Multiple', position: 'bottom', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="pnl"
                name="P&L"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
                label={{ value: 'P&L', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [
                  name === "P&L" ? `$${value.toFixed(2)}` : value.toFixed(2),
                  name
                ]}
              />
              <Scatter name="Wins" data={scatterData.filter(d => d.isWin)} fill="hsl(160 60% 45%)" />
              <Scatter name="Losses" data={scatterData.filter(d => !d.isWin)} fill="hsl(0 70% 50%)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Winning trades</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-muted-foreground">Losing trades</span>
          </div>
        </div>
      </div>

      {/* PnL Distribution + Holding Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PnL Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">P&L Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pnlDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.range.includes("-") ? "hsl(0 70% 50%)" : "hsl(160 60% 45%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holding Time Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Holding Time Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={holdingTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "avgPnl" ? `$${value.toFixed(2)}` : value,
                    name === "avgPnl" ? "Avg P&L" : "Count"
                  ]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best & Worst Trades Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Trades */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Best Trades</h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Symbol</th>
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Strategy</th>
                  <th className="text-right p-3 text-xs font-light text-muted-foreground">P&L</th>
                </tr>
              </thead>
              <tbody>
                {best.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3 text-muted-foreground">{format(trade.date, "MMM d")}</td>
                    <td className="p-3 text-foreground">{trade.symbol}</td>
                    <td className="p-3 text-muted-foreground">{trade.strategy}</td>
                    <td className="p-3 text-right text-emerald-400">
                      +${trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worst Trades */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Worst Trades</h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Symbol</th>
                  <th className="text-left p-3 text-xs font-light text-muted-foreground">Strategy</th>
                  <th className="text-right p-3 text-xs font-light text-muted-foreground">P&L</th>
                </tr>
              </thead>
              <tbody>
                {worst.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3 text-muted-foreground">{format(trade.date, "MMM d")}</td>
                    <td className="p-3 text-foreground">{trade.symbol}</td>
                    <td className="p-3 text-muted-foreground">{trade.strategy}</td>
                    <td className="p-3 text-right text-rose-400">
                      ${trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeAnalysisTab;
