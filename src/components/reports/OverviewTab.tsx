import { useState } from "react";
import { Info, CaretDown, CaretUp } from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface OverviewTabProps {
  trades: Trade[];
}

const OverviewTab = ({ trades }: OverviewTabProps) => {
  const stats = calculateOverviewStats(trades);
  const equityCurve = generateEquityCurve(trades);
  const winLossData = generateWinLossData(trades);
  const longShortData = generateLongShortData(trades);
  const insight = generateAIInsights(trades, "overview");
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  // Primary metrics (always shown)
  const primaryKpis = [
    { 
      label: "Total P&L", 
      value: `$${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      color: stats.totalPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
    },
    { 
      label: "Win Rate", 
      value: `${stats.winRate.toFixed(0)}%`,
      color: stats.winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
    },
    { 
      label: "Profit Factor", 
      value: stats.profitFactor.toFixed(2),
      color: stats.profitFactor >= 1.5 ? "text-emerald-600 dark:text-emerald-400" : stats.profitFactor >= 1 ? "text-foreground" : "text-rose-600 dark:text-rose-400"
    },
    { 
      label: "Max Drawdown", 
      value: `${stats.maxDrawdown.toFixed(0)}%`,
      color: stats.maxDrawdown > 20 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
    },
  ];

  // Secondary metrics (shown in sheet on mobile)
  const secondaryKpis = [
    { 
      label: "Avg R:R", 
      value: stats.avgRR.toFixed(2),
      color: "text-foreground"
    },
    { 
      label: "Total Trades", 
      value: stats.totalTrades.toString(),
      color: "text-foreground"
    },
  ];

  const allKpis = [...primaryKpis, ...secondaryKpis];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards - Mobile: 4 primary only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* Mobile: Show only primary KPIs */}
        <div className="contents sm:hidden">
          {primaryKpis.map((kpi) => (
            <div key={kpi.label} className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-muted-foreground block mb-0.5">{kpi.label}</span>
              <p className={`text-lg font-semibold tracking-tight ${kpi.color}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        
        {/* Desktop: Show all KPIs */}
        <div className="hidden sm:contents">
          {allKpis.map((kpi) => (
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
      </div>

      {/* Mobile: View all metrics button */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllMetrics(true)}
          className="w-full text-muted-foreground text-xs gap-1"
        >
          View all metrics
          <CaretDown weight="bold" className="w-3 h-3" />
        </Button>
      </div>

      {/* Equity Curve - Full Width with section header */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">📈 Performance</h3>
        </div>
        <div className="glass-card p-3 sm:p-4 rounded-xl">
          <h4 className="text-xs sm:text-sm font-light text-muted-foreground mb-3">Equity Curve</h4>
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" className="hidden sm:block" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  width={45}
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
      </div>

      {/* AI Insight - After charts */}
      <AIInsightBanner insight={insight} />

      {/* Win/Loss + Long/Short Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Win/Loss Distribution */}
        <div className="glass-card p-3 sm:p-4 rounded-xl space-y-3">
          <h3 className="text-xs sm:text-sm font-light text-foreground">Win vs Loss Distribution</h3>
          <div className="h-[160px] sm:h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
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
          <div className="flex justify-center gap-4 sm:gap-6 text-xs">
            {winLossData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long vs Short Performance */}
        <div className="glass-card p-3 sm:p-4 rounded-xl space-y-3">
          <h3 className="text-xs sm:text-sm font-light text-foreground">Long vs Short Performance</h3>
          <div className="h-[160px] sm:h-[200px]">
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
                  width={40}
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
          <div className="flex justify-center gap-4 sm:gap-6 text-xs">
            {longShortData.map((item) => (
              <div key={item.side} className="text-center">
                <span className="text-muted-foreground">{item.side}: </span>
                <span className="text-foreground">{item.trades} trades, </span>
                <span className={item.winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                  {item.winRate.toFixed(0)}% WR
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: All Metrics Sheet */}
      <Sheet open={showAllMetrics} onOpenChange={setShowAllMetrics}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground">All Metrics</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 pb-6">
            {allKpis.map((kpi) => (
              <div key={kpi.label} className="glass-card p-3 rounded-xl">
                <span className="text-[10px] text-muted-foreground block mb-0.5">{kpi.label}</span>
                <p className={`text-lg font-semibold tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OverviewTab;
