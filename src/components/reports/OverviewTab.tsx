import { useState, useMemo } from "react";
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Scales, 
  CurrencyDollar, 
  ChartBar,
  Pulse, // [!code ++] Replaced Activity with Pulse
  ArrowUp,
  ArrowDown
} from "@phosphor-icons/react";
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
  ReferenceLine
} from "recharts";
import { Trade } from "@/lib/tradesData";
import {
  generateEquityCurve,
  generateWinLossData,
  generateLongShortData,
  calculateOverviewStats,
} from "@/lib/reportsData";
import { format } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";

interface OverviewTabProps {
  trades: Trade[];
}

// Helper to generate daily P&L data
const generateDailyPnL = (trades: Trade[]) => {
  const dailyMap = new Map<string, number>();
  
  trades.forEach(trade => {
    const dateStr = format(trade.date, "yyyy-MM-dd");
    const current = dailyMap.get(dateStr) || 0;
    dailyMap.set(dateStr, current + trade.pnl);
  });

  return Array.from(dailyMap.entries())
    .map(([date, value]) => ({
      date: format(new Date(date), "MMM d"),
      value,
      timestamp: new Date(date).getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

const OverviewTab = ({ trades }: OverviewTabProps) => {
  const stats = calculateOverviewStats(trades);
  const equityCurve = generateEquityCurve(trades);
  const winLossData = generateWinLossData(trades);
  const longShortData = generateLongShortData(trades);
  const dailyPnLData = useMemo(() => generateDailyPnL(trades), [trades]);
  const { formatCurrency } = useSettings();

  // Calculate Expectancy
  const expectancy = (stats.winRate / 100 * (stats.totalPnl / stats.wins)) - 
                     ((1 - stats.winRate / 100) * Math.abs(stats.totalPnl / stats.losses)); // Simplified approx

  const metrics = [
    { 
      label: "Net P&L", 
      value: formatCurrency(stats.totalPnl),
      icon: CurrencyDollar,
      trend: stats.totalPnl >= 0 ? "positive" : "negative",
      subtext: "Total realized profit"
    },
    { 
      label: "Win Rate", 
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      trend: stats.winRate >= 50 ? "positive" : "negative",
      subtext: `${stats.wins}W - ${stats.losses}L`
    },
    { 
      label: "Profit Factor", 
      value: stats.profitFactor.toFixed(2),
      icon: ChartBar,
      trend: stats.profitFactor >= 1.5 ? "positive" : stats.profitFactor >= 1 ? "neutral" : "negative",
      subtext: "Gross Profit / Gross Loss"
    },
    { 
      label: "Expectancy", 
      value: formatCurrency(expectancy || 0), // Fallback if calculation is NaN
      icon: Pulse, // [!code ++] Updated icon
      trend: (expectancy || 0) > 0 ? "positive" : "negative",
      subtext: "Avg return per trade"
    },
    { 
      label: "Avg Win", 
      value: formatCurrency(stats.totalPnl > 0 ? stats.totalPnl / stats.wins : 0),
      icon: ArrowUp,
      trend: "positive",
      subtext: "Average winning trade"
    },
    { 
      label: "Avg Loss", 
      value: formatCurrency(stats.losses > 0 ? stats.totalPnl / stats.losses : 0), // Approx
      icon: ArrowDown,
      trend: "negative",
      subtext: "Average losing trade"
    },
    { 
      label: "Risk:Reward", 
      value: `1:${stats.avgRR.toFixed(2)}`,
      icon: Scales,
      trend: stats.avgRR >= 1.5 ? "positive" : "neutral",
      subtext: "Avg Win / Avg Loss"
    },
    { 
      label: "Max Drawdown", 
      value: `${stats.maxDrawdown.toFixed(1)}%`,
      icon: TrendDown,
      trend: stats.maxDrawdown < 20 ? "positive" : "negative",
      subtext: "Peak to valley drop"
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive": return "text-emerald-500";
      case "negative": return "text-rose-500";
      default: return "text-muted-foreground";
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case "positive": return "bg-emerald-500/10 text-emerald-500";
      case "negative": return "bg-rose-500/10 text-rose-500";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="glass-card p-4 rounded-xl flex flex-col justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
              <div className={`p-1.5 rounded-lg ${getTrendBg(metric.trend)}`}>
                <metric.icon weight="bold" className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <h3 className={`text-xl md:text-2xl font-semibold tracking-tight ${getTrendColor(metric.trend)}`}>
                {metric.value}
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {metric.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Equity Curve */}
      <div className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">Equity Curve</h3>
            <p className="text-sm text-muted-foreground">Cumulative P&L performance over time</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-foreground">
               Net P&L: {formatCurrency(stats.totalPnl)}
             </span>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatCurrency(value), "Cumulative P&L"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorPnL)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Daily P&L Analysis */}
      <div className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">Daily P&L</h3>
            <p className="text-sm text-muted-foreground">Net performance by trading day</p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPnLData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
                width={50}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                formatter={(value: number) => [formatCurrency(value), "Net P&L"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" opacity={0.5} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {dailyPnLData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value >= 0 ? "hsl(160 60% 45%)" : "hsl(0 70% 50%)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Distribution Analysis (Win/Loss & Long/Short) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Win/Loss Donut */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-base font-medium text-foreground mb-4">Win vs Loss Distribution</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-[180px] w-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Win Rate */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(0)}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 text-sm">
              {winLossData.map((item) => (
                <div key={item.name} className="flex items-center justify-between w-full min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Total Trades</span>
                <span className="text-foreground font-medium">{stats.totalTrades}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Long/Short Bar */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-base font-medium text-foreground mb-4">Long vs Short Performance</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={longShortData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number" 
                  hide 
                />
                <YAxis 
                  type="category" 
                  dataKey="side" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }} 
                  width={40}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number, name: string) => [
                    name === "pnl" ? formatCurrency(value) : name === "winRate" ? `${value.toFixed(1)}%` : value,
                    name === "pnl" ? "P&L" : name === "winRate" ? "Win Rate" : "Trades"
                  ]}
                />
                <Bar dataKey="pnl" name="pnl" barSize={32} radius={[0, 4, 4, 0]}>
                  {longShortData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 50%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around mt-2 text-xs text-muted-foreground">
            {longShortData.map(item => (
              <div key={item.side} className="text-center">
                <span className="block font-medium text-foreground">{item.side}</span>
                <span>{item.trades} trades • {item.winRate.toFixed(0)}% WR</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;