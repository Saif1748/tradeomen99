import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeAnalysisTabProps {
  data: any;
  isLoading: boolean;
  isError: boolean;
}

const TimeAnalysisTab = ({ data, isLoading, isError }: TimeAnalysisTabProps) => {
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl bg-secondary/50" />
        <Skeleton className="h-[300px] w-full rounded-xl bg-secondary/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-secondary/50" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-64 flex items-center justify-center glass-card rounded-2xl border border-rose-500/20 text-rose-400">
        Failed to load time analysis data.
      </div>
    );
  }

  // ✅ Extracting data from your SQL RPC keys
  const dayData = data?.dayPerformance || [];
  const hourData = data?.hourPerformance || [];
  const sessionData = data?.sessionPerformance || [];

  // Heatmap Color Logic
  const validWinRates = dayData.filter((d: any) => d.trades > 0).map((d: any) => d.winRate || 0);
  const maxWinRate = validWinRates.length > 0 ? Math.max(...validWinRates) : 0;
  const minWinRate = validWinRates.length > 0 ? Math.min(...validWinRates) : 0;

  const getHeatmapColor = (winRate: number, trades: number) => {
    if (!trades || trades === 0) return "hsl(var(--muted))";
    const normalized = (winRate - minWinRate) / (maxWinRate - minWinRate || 1);
    
    // SaaS Grade Color Tiers
    if (normalized >= 0.7) return "hsl(142, 71%, 35%)"; // Strong Green
    if (normalized >= 0.4) return "hsl(142, 40%, 25%)"; // Subtle Green
    if (normalized >= 0.2) return "hsl(38, 92%, 25%)";  // Amber/Neutral
    return "hsl(346, 84%, 30%)";                       // Muted Red
  };

  return (
    <div className="space-y-6">
      {/* 1. Day of Week Heatmap */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Day of Week Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {dayData.map((day: any) => (
            <div 
              key={day.day} 
              className="rounded-xl p-4 text-center transition-all hover:scale-[1.02] border border-border/50" 
              style={{ backgroundColor: getHeatmapColor(day.winRate, day.trades) }}
            >
              <p className="text-[10px] uppercase font-bold text-foreground/70 mb-1">{day.day}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {day.trades > 0 ? `${(day.winRate || 0).toFixed(0)}%` : '-'}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                <p className="text-[10px] text-foreground/60">{day.trades || 0} trades</p>
                <p className={`text-[10px] font-bold ${day.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {day.trades > 0 ? `${day.pnl >= 0 ? '+' : ''}$${Math.abs(day.pnl).toFixed(0)}` : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* 2. Hour of Day Performance Chart */}
      <div className="glass-card p-5 rounded-2xl border border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-6">Hourly P&L Breakdown</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="hour" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(h) => `${h}:00`}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} 
                formatter={(value: number, name: string) => [
                  name === "pnl" ? `$${value.toFixed(2)}` : `${(value || 0).toFixed(1)}%`, 
                  name === "pnl" ? "Net P&L" : "Win Rate"
                ]} 
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {hourData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(346, 84%, 61%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* 3. Session Performance Analysis */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Market Session Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionData.map((session: any) => (
            <div key={session.session} className="glass-card p-5 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{session.session}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (session.winRate || 0) >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {session.session === 'Asian/Other' ? 'Low Vol' : 'Peak Vol'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Volume</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{session.trades || 0} trades</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Success Rate</span>
                  <span className={`text-sm font-bold tabular-nums ${(session.winRate || 0) >= 50 ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {(session.winRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Profitability</span>
                  <span className={`text-sm font-bold tabular-nums ${(session.pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {session.pnl >= 0 ? '+' : ''}${Math.abs(session.pnl || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Mini visual indicator */}
              <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${(session.pnl || 0) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${session.winRate || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeAnalysisTab;