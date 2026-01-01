import { Info } from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Trade } from "@/lib/tradesData";
import {
  generateEquityCurve,
  generateWinLossData,
  generateLongShortData,
  calculateOverviewStats,
  generateAIInsights,
} from "@/lib/reportsData";
import AIInsightBanner from "./AIInsightBanner";

interface OverviewTabProps {
  trades: Trade[];
}

const OverviewTab = ({ trades }: OverviewTabProps) => {
  const stats = calculateOverviewStats(trades);
  const equityCurve = generateEquityCurve(trades);
  const winLossData = generateWinLossData(trades);
  const longShortData = generateLongShortData(trades);
  const insight = generateAIInsights(trades, "overview");

  const kpiCards = [
    { 
      label: "Total P&L", 
      value: `$${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      color: stats.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
    },
    { 
      label: "Win Rate", 
      value: `${stats.winRate.toFixed(1)}%`,
      color: stats.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
    },
    { 
      label: "Profit Factor", 
      value: stats.profitFactor.toFixed(2),
      color: stats.profitFactor >= 1.5 ? "text-emerald-400" : stats.profitFactor >= 1 ? "text-foreground" : "text-rose-400"
    },
    { 
      label: "Avg R:R", 
      value: stats.avgRR.toFixed(2),
      color: "text-foreground"
    },
    { 
      label: "Max Drawdown", 
      value: `${stats.maxDrawdown.toFixed(1)}%`,
      color: stats.maxDrawdown > 20 ? "text-rose-400" : "text-foreground"
    },
    { 
      label: "Total Trades", 
      value: stats.totalTrades.toString(),
      color: "text-foreground"
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Insight */}
      <AIInsightBanner insight={insight} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <Info weight="regular" className="w-3 h-3 text-muted-foreground/50" />
            </div>
            <p className={`text-xl font-normal tracking-tight-premium ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Equity Curve - Full Width */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Equity Curve</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win/Loss + Long/Short Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Win vs Loss Distribution</h3>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs">
            {winLossData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long vs Short Performance */}
        <div className="space-y-3">
          <h3 className="text-sm font-light text-foreground">Long vs Short Performance</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={longShortData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  type="category" 
                  dataKey="side"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "pnl" ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`,
                    name === "pnl" ? "P&L" : "Win Rate"
                  ]}
                />
                <Bar 
                  dataKey="pnl" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs">
            {longShortData.map((item) => (
              <div key={item.side} className="text-center">
                <span className="text-muted-foreground">{item.side}: </span>
                <span className="text-foreground">{item.trades} trades, </span>
                <span className={item.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}>
                  {item.winRate.toFixed(0)}% win rate
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
