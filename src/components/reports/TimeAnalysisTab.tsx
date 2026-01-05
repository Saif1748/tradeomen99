import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trade } from "@/lib/tradesData";
import { generateDayPerformance, generateHourPerformance, generateSessionPerformance } from "@/lib/reportsData";

interface TimeAnalysisTabProps {
  trades: Trade[];
}

const TimeAnalysisTab = ({ trades }: TimeAnalysisTabProps) => {
  const dayData = generateDayPerformance(trades);
  const hourData = generateHourPerformance();
  const sessionData = generateSessionPerformance(trades);

  const maxWinRate = Math.max(...dayData.map(d => d.winRate));
  const minWinRate = Math.min(...dayData.filter(d => d.trades > 0).map(d => d.winRate));

  const getHeatmapColor = (winRate: number, trades: number) => {
    if (trades === 0) return "hsl(var(--muted))";
    const normalized = (winRate - minWinRate) / (maxWinRate - minWinRate || 1);
    if (normalized >= 0.7) return "hsl(160 60% 35%)";
    if (normalized >= 0.4) return "hsl(160 40% 25%)";
    if (normalized >= 0.2) return "hsl(40 50% 30%)";
    return "hsl(0 50% 35%)";
  };

  return (
    <div className="space-y-6">
      {/* Day of Week Heatmap */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Day of Week Performance</h3>
        <div className="grid grid-cols-7 gap-2">
          {dayData.map((day) => (
            <div key={day.day} className="rounded-xl p-4 text-center transition-all hover:scale-105" style={{ backgroundColor: getHeatmapColor(day.winRate, day.trades) }}>
              <p className="text-xs text-foreground/70 mb-1">{day.day}</p>
              <p className="text-lg font-normal text-foreground">{day.trades > 0 ? `${day.winRate.toFixed(0)}%` : '-'}</p>
              <p className="text-xs text-foreground/60 mt-1">{day.trades} trades</p>
              <p className={`text-xs mt-1 ${day.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{day.trades > 0 ? `$${day.pnl.toFixed(0)}` : '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hour of Day Performance */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Hour of Day P&L</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number, name: string) => [name === "pnl" ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`, name === "pnl" ? "P&L" : "Win Rate"]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {hourData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "hsl(160 60% 45%)" : "hsl(0 70% 50%)"} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Performance */}
      <div className="space-y-3">
        <h3 className="text-sm font-light text-foreground">Session Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionData.map((session) => (
            <div key={session.session} className="glass-card p-5 rounded-xl">
              <h4 className="text-sm font-medium text-foreground mb-4">{session.session}</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Trades</span><span className="text-sm text-foreground">{session.trades}</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Win Rate</span><span className={`text-sm ${session.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{session.winRate}%</span></div>
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">Avg P&L</span><span className={`text-sm ${session.avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${session.avgPnl}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeAnalysisTab;