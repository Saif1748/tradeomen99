import { useMemo } from "react";
import { 
  CurrencyDollar, 
  Scales, 
  ChartBar, 
  Pulse, // [!code ++] Replaced Activity with Pulse
  Coins, 
  TrendUp, 
  TrendDown,
   // [!code --] Removed Activity
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
import { Trade } from "@/lib/tradesData";
import { getBestWorstTrades } from "@/lib/reportsData";
import { format } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";

interface TradeAnalysisTabProps {
  trades: Trade[];
}

// --- Helper Functions ---

// Generate performance by Asset Type (Crypto, Stock, etc.)
const generateTypePerformance = (trades: Trade[]) => {
  const typeMap = new Map<string, { pnl: number; count: number; winCount: number }>();
  
  trades.forEach(t => {
    const current = typeMap.get(t.type) || { pnl: 0, count: 0, winCount: 0 };
    typeMap.set(t.type, {
      pnl: current.pnl + t.pnl,
      count: current.count + 1,
      winCount: current.winCount + (t.pnl > 0 ? 1 : 0)
    });
  });

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    name: type,
    pnl: data.pnl,
    count: data.count,
    winRate: (data.winCount / data.count) * 100
  })).sort((a, b) => b.pnl - a.pnl);
};

// Generate Risk vs PnL Scatter Data
const generateRiskScatter = (trades: Trade[]) => {
  return trades.map(t => ({
    risk: t.risk || 0,
    pnl: t.pnl,
    rMultiple: t.rMultiple,
    isWin: t.pnl > 0,
    symbol: t.symbol,
    date: format(t.date, "MMM d")
  }));
};

// Generate Tag Performance
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

const COLORS = ["hsl(270 70% 55%)", "hsl(200 70% 50%)", "hsl(160 60% 45%)", "hsl(45 90% 55%)", "hsl(320 70% 50%)", "hsl(30 80% 55%)", "hsl(180 60% 45%)", "hsl(0 70% 50%)"];

const TradeAnalysisTab = ({ trades }: TradeAnalysisTabProps) => {
  const { formatCurrency } = useSettings();
  
  // Memos for performance
  const typeData = useMemo(() => generateTypePerformance(trades), [trades]);
  const riskData = useMemo(() => generateRiskScatter(trades), [trades]);
  const tagPerformance = useMemo(() => generateTagPerformance(trades), [trades]);
  const { best, worst } = useMemo(() => getBestWorstTrades(trades, 5), [trades]);

  // KPI Calculations
  const totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0);
  const avgRisk = trades.reduce((sum, t) => sum + (t.risk || 0), 0) / (trades.length || 1);
  const totalVolume = trades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
  const netPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const grossPnL = netPnL + totalFees;
  const feesImpactPct = grossPnL !== 0 ? (totalFees / Math.abs(grossPnL)) * 100 : 0;

  const kpis = [
    { 
      label: "Total Fees Paid", 
      value: formatCurrency(totalFees),
      icon: Coins, 
      subtext: `${feesImpactPct.toFixed(1)}% of Gross PnL`,
      color: "text-rose-400"
    },
    { 
      label: "Avg Risk per Trade", 
      value: formatCurrency(avgRisk), 
      icon: Scales,
      subtext: "Position Sizing",
      color: "text-blue-400"
    },
    { 
      label: "Total Volume", 
      value: `$${(totalVolume / 1000).toFixed(1)}k`, 
      icon: Pulse, // [!code ++] Updated Icon
      subtext: "Notional Value",
      color: "text-purple-400"
    },
    { 
      label: "Avg Return", 
      value: formatCurrency(netPnL / trades.length), 
      icon: ChartBar,
      subtext: "Per Trade",
      color: netPnL >= 0 ? "text-emerald-400" : "text-rose-400"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Enhanced KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              <div className="p-1.5 rounded-lg bg-secondary/50 text-foreground">
                <kpi.icon weight="duotone" className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-semibold tracking-tight ${kpi.color}`}>
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
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-medium text-foreground">Performance by Asset</h3>
            <span className="text-xs text-muted-foreground">PnL Breakdown</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
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
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Net P&L"]}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={32}>
                  {typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 50%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk vs Reward Scatter */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-medium text-foreground">Risk vs Reward Analysis</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Win
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Loss
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  dataKey="risk" 
                  name="Risk" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                  label={{ value: 'Risk Amount ($)', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="pnl" 
                  name="PnL" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{ value: 'PnL ($)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'Risk' ? 'Risk Taken' : 'PnL Realized']}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Scatter name="Wins" data={riskData.filter(d => d.isWin)} fill="hsl(160 60% 45%)" shape="circle" />
                <Scatter name="Losses" data={riskData.filter(d => !d.isWin)} fill="hsl(0 70% 50%)" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Tag Intelligence */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="text-base font-medium text-foreground mb-6">Tag Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tagPerformance}
                  dataKey="count"
                  nameKey="tag"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {tagPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="tag" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} 
                  width={70}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Total PnL"]}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={20}>
                  {tagPerformance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "hsl(0 70% 50%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Best & Worst Trades List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">🏆 Best Performers</h3>
            <span className="text-xs text-muted-foreground">Top 5 by PnL</span>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">PnL</th>
                </tr>
              </thead>
              <tbody>
                {best.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{format(trade.date, "MMM d")}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{trade.symbol}</span>
                        {trade.side === "SHORT" && <TrendDown className="w-3 h-3 text-rose-400" />}
                      </div>
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{trade.type}</td>
                    <td className="p-3 text-right font-medium text-emerald-400">
                      +{formatCurrency(trade.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">⚠️ Costliest Misses</h3>
            <span className="text-xs text-muted-foreground">Bottom 5 by PnL</span>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">PnL</th>
                </tr>
              </thead>
              <tbody>
                {worst.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs">{format(trade.date, "MMM d")}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{trade.symbol}</span>
                        {trade.side === "SHORT" && <TrendDown className="w-3 h-3 text-rose-400" />}
                      </div>
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{trade.type}</td>
                    <td className="p-3 text-right font-medium text-rose-400">
                      {formatCurrency(trade.pnl)}
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