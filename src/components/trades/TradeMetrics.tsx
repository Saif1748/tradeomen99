import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { format } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { Trade } from "@/types/trade";
import { CircleNotch } from "@phosphor-icons/react";

interface TradesMetricsProps {
  trades: Trade[];
  isLoading: boolean;
}

// 🎯 Circular Progress Component (The rings in the image)
const CircularMetric = ({ label, value, subValue, color }: { label: string; value: number; subValue: string; color: string }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  // Parse "50%" -> 0.5 for stroke offset
  const percent = parseFloat(subValue) / 100;
  const offset = circumference - percent * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">{label}</span>
        <span className={cn("text-sm font-bold tabular-nums", color)}>{value}</span>
      </div>
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Background Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-secondary" />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className="absolute text-[8px] font-medium text-muted-foreground">{subValue}</span>
      </div>
    </div>
  );
};

export const TradesMetrics = ({ trades, isLoading }: TradesMetricsProps) => {
  const { formatCurrency } = useSettings();

  // 📊 Calculate Stats
  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let open = 0;
    let totalWinPnl = 0;
    let totalLossPnl = 0;
    let netPnl = 0;
    let equityCurve = [];
    let runningTotal = 0;

    // Sort by date ascending for the chart
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = a.entryDate instanceof Date ? a.entryDate : a.entryDate.toDate();
        const dateB = b.entryDate instanceof Date ? b.entryDate : b.entryDate.toDate();
        return dateA.getTime() - dateB.getTime();
    });

    for (const t of sortedTrades) {
      const pnl = t.netPnl || 0;
      netPnl += pnl;
      
      // Equity Curve Data
      runningTotal += pnl;
      equityCurve.push({ value: runningTotal });

      if (!t.exitDate) {
        open++;
      } else if (pnl > 0) {
        wins++;
        totalWinPnl += pnl;
      } else {
        losses++;
        totalLossPnl += pnl;
      }
    }

    const totalClosed = wins + losses;
    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;
    const lossRate = totalClosed > 0 ? Math.round((losses / totalClosed) * 100) : 0;
    const avgWin = wins > 0 ? totalWinPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLossPnl / losses : 0;

    // Return percentage (Mocking specific returns calculation for demo)
    const returnPercent = totalClosed > 0 ? (netPnl / Math.abs(totalLossPnl || 1)) * 100 : 0;

    return {
      wins, losses, open,
      winRate, lossRate,
      avgWin, avgLoss,
      netPnl,
      returnPercent,
      equityCurve: equityCurve.length > 0 ? equityCurve : [{ value: 0 }, { value: 0 }]
    };
  }, [trades]);

  if (isLoading) return <div className="h-24 w-full bg-secondary/10 animate-pulse rounded-2xl" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_1fr] gap-4 mb-6">
      
      {/* 1. Equity Curve (Left) */}
      <div className="glass-card bg-card/40 border border-border/40 rounded-2xl p-0 overflow-hidden relative group">
        <div className="absolute top-3 left-4 z-10">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Equity Curve</span>
        </div>
        <div className="w-full h-24 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['auto', 'auto']} />
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

      {/* 2. Key Metrics (Middle) */}
      <div className="glass-card bg-card/40 border border-border/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Wins / Losses Circles */}
        <div className="flex items-center gap-6 border-r border-border/30 pr-6">
          <CircularMetric 
            label="Wins" 
            value={stats.wins} 
            subValue={`${stats.winRate}%`} 
            color="text-emerald-500" 
          />
          <CircularMetric 
            label="Losses" 
            value={stats.losses} 
            subValue={`${stats.lossRate}%`} 
            color="text-rose-500" 
          />
        </div>

        {/* Open / Wash (Simple text) */}
        <div className="flex items-center gap-6 border-r border-border/30 pr-6">
           <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Open</span>
              <span className="text-sm font-bold text-foreground">{stats.open}</span>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Wash</span>
              <span className="text-sm font-bold text-foreground">0</span>
           </div>
        </div>

        {/* Averages */}
        <div className="flex flex-col gap-2 min-w-[120px]">
           <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Avg W</span>
              <span className="text-sm font-bold text-emerald-500 tabular-nums">{formatCurrency(stats.avgWin)}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Avg L</span>
              <span className="text-sm font-bold text-rose-500 tabular-nums">{formatCurrency(stats.avgLoss)}</span>
           </div>
        </div>
      </div>

      {/* 3. Total PnL (Right) */}
      <div className="glass-card bg-card/40 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
         <span className="text-xs uppercase text-muted-foreground font-semibold mb-1">Total P&L</span>
         <span className={cn(
           "text-2xl lg:text-3xl font-black tracking-tight tabular-nums z-10",
           stats.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"
         )}>
            {formatCurrency(stats.netPnl)}
         </span>
         
         <div className={cn(
           "mt-2 px-3 py-0.5 rounded-full text-xs font-bold z-10",
           stats.netPnl >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
         )}>
            {stats.netPnl >= 0 ? "+" : ""}{stats.returnPercent.toFixed(1)}%
         </div>

         {/* Background Glow */}
         <div className={cn(
           "absolute inset-0 opacity-10 blur-3xl",
           stats.netPnl >= 0 ? "bg-emerald-500" : "bg-rose-500"
         )} />
      </div>
    </div>
  );
};