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
  PieChart,
  Pie,
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
import { useSettings } from "@/contexts/SettingsContext";

interface TradeAnalysisTabProps {
  trades: Trade[];
}

// Generate tag performance data from trades
const generateTagPerformance = (trades: Trade[]) => {
  const tagMap = new Map<string, { count: number; pnl: number; wins: number }>();
  
  trades.forEach(trade => {
    trade.tags.forEach(tag => {
      const existing = tagMap.get(tag) || { count: 0, pnl: 0, wins: 0 };
      tagMap.set(tag, {
        count: existing.count + 1,
        pnl: existing.pnl + trade.pnl,
        wins: existing.wins + (trade.pnl > 0 ? 1 : 0),
      });
    });
  });
  
  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      pnl: data.pnl,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

const COLORS = [
  "hsl(270 70% 55%)",
  "hsl(200 70% 50%)",
  "hsl(160 60% 45%)",
  "hsl(45 90% 55%)",
  "hsl(320 70% 50%)",
  "hsl(30 80% 55%)",
  "hsl(180 60% 45%)",
  "hsl(0 70% 50%)",
];

const TradeAnalysisTab = ({ trades }: TradeAnalysisTabProps) => {
  const scatterData = generateScatterData(trades);
  const pnlDistribution = generatePnLDistribution(trades);
  const holdingTimeData = generateHoldingTimeData(trades);
  const { best, worst } = getBestWorstTrades(trades, 5);
  const insight = generateAIInsights(trades, "tradeAnalysis");
  const tagPerformance = generateTagPerformance(trades);
  const { formatCurrency } = useSettings();

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

      {/* Tags Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tags Distribution Pie Chart */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Tags Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tagPerformance}
                  dataKey="count"
                  nameKey="tag"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ tag, count }) => `${tag} (${count})`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                >
                  {tagPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string, props) => {
                    const tagData = props.payload;
                    return [
                      <div key="tooltip" className="space-y-1">
                        <div>Trades: {tagData.count}</div>
                        <div>P&L: {formatCurrency(tagData.pnl)}</div>
                        <div>Win Rate: {tagData.winRate.toFixed(1)}%</div>
                      </div>,
                      tagData.tag
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tags P&L Bar Chart */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">P&L by Tag</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  type="category"
                  dataKey="tag"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "P&L"]}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {tagPerformance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? "hsl(160 60% 45%)" : "hsl(0 70% 50%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
