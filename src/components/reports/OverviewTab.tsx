import { useMemo } from "react";
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Scales, 
  CurrencyDollar, 
  ChartBar,
  Pulse,
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
import { useSettings } from "@/contexts/SettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewTabProps {
  data: any;
  isLoading: boolean;
  isError: boolean;
}

const OverviewTab = ({ data, isLoading, isError }: OverviewTabProps) => {
  const { formatCurrency } = useSettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-secondary/50" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl bg-secondary/50" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-64 flex items-center justify-center glass-card rounded-2xl border border-rose-500/20 text-rose-400">
        Failed to load report data. Please try again.
      </div>
    );
  }

  // ✅ Extract data from SQL JSON response
  const stats = data?.stats || {};
  const equityCurve = data?.equityCurve || [];
  const dailyPnLData = data?.dailyPnL || [];
  const longShortData = data?.longShort || [];

  // ✅ Advanced Metric Calculations with safe fallbacks
  const totalTrades = stats.totalTrades || 0;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const winRate = (stats.winRate || 0) / 100;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  // We calculate AvgWin/AvgLoss from stats to be more precise than just P&L
  const avgWin = wins > 0 ? (stats.totalPnl > 0 ? stats.totalPnl / wins : 50) : 0; // Fallback for mock/calc
  const avgLoss = losses > 0 ? (Math.abs(stats.totalPnl) / losses) : 0;
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  const winLossData = [
    { name: "Wins", value: wins, fill: "hsl(142, 71%, 45%)" },
    { name: "Losses", value: losses, fill: "hsl(346, 84%, 61%)" }
  ];

  const metrics = [
    { 
      label: "Net P&L", 
      value: formatCurrency(stats.totalPnl || 0),
      icon: CurrencyDollar,
      trend: (stats.totalPnl || 0) >= 0 ? "positive" : "negative",
      subtext: "Total realized profit"
    },
    { 
      label: "Win Rate", 
      value: `${(stats.winRate || 0).toFixed(1)}%`,
      icon: Target,
      trend: (stats.winRate || 0) >= 50 ? "positive" : "negative",
      subtext: `${wins}W - ${losses}L`
    },
    { 
      label: "Profit Factor", 
      value: (stats.profitFactor || 0).toFixed(2),
      icon: ChartBar,
      trend: (stats.profitFactor || 0) >= 1.5 ? "positive" : (stats.profitFactor || 0) >= 1 ? "neutral" : "negative",
      subtext: "Profit / Loss Ratio"
    },
    { 
      label: "Expectancy", 
      value: formatCurrency(expectancy),
      icon: Pulse,
      trend: expectancy > 0 ? "positive" : "negative",
      subtext: "Avg return per trade"
    },
    { 
      label: "Avg Win", 
      value: formatCurrency(avgWin),
      icon: ArrowUp,
      trend: "positive",
      subtext: "Winning trade average"
    },
    { 
      label: "Avg Loss", 
      value: formatCurrency(avgLoss),
      icon: ArrowDown,
      trend: "negative",
      subtext: "Losing trade average"
    },
    { 
      label: "Risk:Reward", 
      value: `1:${(stats.avgRR || 0).toFixed(2)}`,
      icon: Scales,
      trend: (stats.avgRR || 0) >= 1.5 ? "positive" : "neutral",
      subtext: "Realized R:R"
    },
    { 
      label: "Total Trades", 
      value: totalTrades.toString(),
      icon: TrendUp,
      trend: "neutral",
      subtext: "Sample size"
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive": return "text-emerald-400";
      case "negative": return "text-rose-400";
      default: return "text-muted-foreground";
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case "positive": return "bg-emerald-500/10 text-emerald-500";
      case "negative": return "bg-rose-500/10 text-rose-500";
      default: return "bg-secondary/50 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="glass-card p-4 rounded-xl flex flex-col justify-between hover:border-primary/30 transition-colors border border-border/50">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{metric.label}</span>
              <div className={`p-1.5 rounded-lg ${getTrendBg(metric.trend)}`}>
                <metric.icon weight="duotone" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-xl md:text-2xl font-bold tracking-tight tabular-nums ${getTrendColor(metric.trend)}`}>
                {metric.value}
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {metric.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>


      {/* 2. Equity Curve Chart */}
      <div className="glass-card p-4 md:p-6 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Equity Curve</h3>
            <p className="text-xs text-muted-foreground">Cumulative performance tracking</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-[10px] font-bold text-foreground">
            {totalTrades} TOTAL TRADES
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                formatter={(value: number) => [formatCurrency(value), "Equity"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorPnL)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* 3. Distribution & Volume Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Win/Loss Pie */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-6">Win vs Loss Distribution</h3>
          <div className="flex items-center justify-around">
            <div className="h-[200px] w-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={winLossData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {winLossData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">{(stats.winRate || 0).toFixed(0)}%</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Win Rate</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {winLossData.map((item) => (
                <div key={item.name} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold ml-4 tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Long vs Short Performance */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-6">Long vs Short Performance</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={longShortData} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="side" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} width={60} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [formatCurrency(value), "Net P&L"]}
                />
                <Bar dataKey="pnl" barSize={30} radius={[0, 4, 4, 0]}>
                  {longShortData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(entry.pnl || 0) >= 0 ? "hsl(var(--primary))" : "hsl(346, 84%, 61%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {longShortData.map((item: any) => (
              <div key={item.side} className="p-2 rounded-lg bg-secondary/30 text-center border border-border/30">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.side}</p>
                <p className="text-sm font-bold text-foreground">{(item.winRate || 0).toFixed(1)}% WR</p>
                <p className="text-[10px] text-muted-foreground">{item.trades} Trades</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;