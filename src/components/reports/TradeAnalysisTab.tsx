import { useMemo } from "react";
import { 
  CurrencyDollar, 
  Scales, 
  ChartBar, 
  Pulse, 
  Coins, 
  TrendUp, 
  TrendDown,
} from "@phosphor-icons/react";
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
  ReferenceLine,
  Legend
} from "recharts";
import { format } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeAnalysisTabProps {
  data: any;
  isLoading: boolean;
  isError: boolean;
}

const COLORS = ["hsl(270 70% 55%)", "hsl(200 70% 50%)", "hsl(160 60% 45%)", "hsl(45 90% 55%)", "hsl(320 70% 50%)", "hsl(30 80% 55%)", "hsl(180 60% 45%)", "hsl(0 70% 50%)"];

const TradeAnalysisTab = ({ data, isLoading, isError }: TradeAnalysisTabProps) => {
  const { formatCurrency } = useSettings();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-secondary/50" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-2xl bg-secondary/50" />
          <Skeleton className="h-[300px] rounded-2xl bg-secondary/50" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-64 flex items-center justify-center glass-card rounded-2xl border-rose-500/20 text-rose-400">
        Failed to load analysis data.
      </div>
    );
  }

  // ✅ Mapping to your SQL RPC keys with safe fallbacks
  const kpis = data?.kpis || {};
  const assetPerformance = data?.assetPerformance || [];
  const riskData = data?.riskScatter || [];
  const tagPerformance = data?.tagPerformance || [];
  const best = data?.bestTrades || [];
  const worst = data?.worstTrades || [];

  // KPI Impact logic
  const feesImpactPct = kpis.totalFees !== 0 ? (kpis.totalFees / Math.abs(kpis.totalVolume || 1)) * 100 : 0;

  const kpiMetrics = [
    { 
      label: "Total Fees Paid", 
      value: formatCurrency(kpis.totalFees || 0),
      icon: Coins, 
      subtext: `${feesImpactPct.toFixed(1)}% of Notional`,
      color: "text-rose-400"
    },
    { 
      label: "Avg Risk per Trade", 
      value: formatCurrency(kpis.avgRisk || 0), 
      icon: Scales,
      subtext: "Position Sizing",
      color: "text-blue-400"
    },
    { 
      label: "Total Volume", 
      value: `$${((kpis.totalVolume || 0) / 1000).toFixed(1)}k`, 
      icon: Pulse,
      subtext: "Notional Value",
      color: "text-purple-400"
    },
    { 
      label: "Avg Return", 
      value: formatCurrency(kpis.avgReturn || 0), 
      icon: ChartBar,
      subtext: "Per Trade",
      color: (kpis.avgReturn || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpiMetrics.map((kpi, i) => (
          <div key={i} className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors border border-border/50">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              <div className="p-1.5 rounded-lg bg-secondary/50 text-foreground">
                <kpi.icon weight="duotone" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-semibold tracking-tight tabular-nums ${kpi.color}`}>
                {kpi.value}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Asset & Risk Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        
        {/* Performance by Asset Type */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-medium text-foreground">Performance by Asset</h3>
            <span className="text-xs text-muted-foreground">PnL Breakdown</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetPerformance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }} 
                  width={60}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [formatCurrency(value), "Net P&L"]}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={32}>
                  {assetPerformance.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 50%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk vs Reward Scatter */}
        <div className="glass-card p-5 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-medium text-foreground">Risk vs Reward Analysis</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Win</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Loss</div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" dataKey="risk" name="Risk" tick={{ fontSize: 10 }} label={{ value: 'Risk ($)', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="number" dataKey="pnl" name="PnL" tick={{ fontSize: 10 }} label={{ value: 'PnL ($)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'Risk' ? 'Risk' : 'PnL']}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Scatter name="Wins" data={riskData.filter((d: any) => d.isWin)} fill="hsl(160 60% 45%)" shape="circle" />
                <Scatter name="Losses" data={riskData.filter((d: any) => !d.isWin)} fill="hsl(0 70% 50%)" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Tag Intelligence */}
      <div className="glass-card p-5 rounded-2xl border border-border/50">
        <h3 className="text-base font-medium text-foreground mb-6">Tag Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tagPerformance} dataKey="count" nameKey="tag" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                  {tagPerformance.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="tag" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [formatCurrency(value), "Total PnL"]} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={20}>
                  {tagPerformance.map((entry: any, index: number) => <Cell key={index} fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 50%)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Best & Worst Trades List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {[
          { title: "🏆 Best Performers", trades: best, color: "text-emerald-400" },
          { title: "⚠️ Costliest Misses", trades: worst, color: "text-rose-400" }
        ].map((list, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{list.title}</h3>
            <div className="glass-card rounded-xl overflow-hidden border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Symbol</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {list.trades.map((trade: any) => (
                    <tr key={trade.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs">{format(new Date(trade.date), "MMM d")}</td>
                      <td className="p-3 font-medium text-foreground">{trade.symbol}</td>
                      <td className={`p-3 text-right font-medium tabular-nums ${list.color}`}>
                        {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeAnalysisTab;