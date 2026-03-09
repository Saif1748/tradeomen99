import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity,
  Target, Clock, Flame, PieChart as PieChartIcon, Percent,
  ArrowUpDown, Scale, Zap, Brain, Shield, Award, Calendar,
  LineChart, BarChart, CandlestickChart, Gauge, Hash, Layers,
  Timer, Crosshair, Trophy, AlertTriangle, Banknote, Wallet,
} from "lucide-react";
import { sampleTrades } from "@/data/trades";
import { sampleStrategies } from "@/data/strategies";
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as ReLineChart, Line, AreaChart, Area } from "recharts";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: React.ElementType;
  defaultW: number;
  defaultH: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export type WidgetCategory =
  | "performance"
  | "risk"
  | "execution"
  | "psychology"
  | "charts"
  | "strategy"
  | "account";

export const CATEGORY_META: Record<WidgetCategory, { label: string; color: string }> = {
  performance: { label: "Performance", color: "hsl(var(--success))" },
  risk: { label: "Risk Management", color: "hsl(var(--loss))" },
  execution: { label: "Execution Quality", color: "hsl(var(--primary))" },
  psychology: { label: "Psychology", color: "hsl(145 63% 49%)" },
  charts: { label: "Charts & Visuals", color: "hsl(var(--accent))" },
  strategy: { label: "Strategy", color: "hsl(262 83% 58%)" },
  account: { label: "Account & Money", color: "hsl(45 93% 47%)" },
};

// ──────────────────────────────────────────────
// Computed data helpers
// ──────────────────────────────────────────────
function computeStats() {
  const trades = sampleTrades;
  const closed = trades.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => t.netPnl > 0);
  const losses = closed.filter((t) => t.netPnl <= 0);
  const totalPnl = closed.reduce((s, t) => s + t.netPnl, 0);
  const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const avgRR = closed.filter(t => t.riskMultiple !== undefined).reduce((s, t) => s + (t.riskMultiple || 0), 0) / (closed.filter(t => t.riskMultiple !== undefined).length || 1);
  const avgHoldingTime = closed.reduce((s, t) => s + (t.durationSeconds || 0), 0) / (closed.length || 1);
  const totalVolume = closed.reduce((s, t) => s + (t.totalBuyValue || 0), 0);
  const totalFees = closed.reduce((s, t) => s + (t.totalFees || 0), 0);
  const avgExecScore = closed.filter(t => t.executionScore).reduce((s, t) => s + (t.executionScore || 0), 0) / (closed.filter(t => t.executionScore).length || 1);
  const avgDiscipline = closed.filter(t => t.disciplineScore).reduce((s, t) => s + (t.disciplineScore || 0), 0) / (closed.filter(t => t.disciplineScore).length || 1);
  const emotions = closed.reduce((acc, t) => { if (t.emotion) acc[t.emotion] = (acc[t.emotion] || 0) + 1; return acc; }, {} as Record<string, number>);
  const longTrades = closed.filter(t => t.direction === "long");
  const shortTrades = closed.filter(t => t.direction === "short");
  const bestTrade = closed.reduce((best, t) => t.netPnl > (best?.netPnl || -Infinity) ? t : best, closed[0]);
  const worstTrade = closed.reduce((worst, t) => t.netPnl < (worst?.netPnl || Infinity) ? t : worst, closed[0]);
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.netPnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.netPnl)) : 0;
  const avgReturn = closed.reduce((s, t) => s + (t.returnPercent || 0), 0) / (closed.length || 1);
  const maxDrawdown = Math.min(...closed.map(t => t.netPnl));

  return {
    trades, closed, wins, losses, totalPnl, grossProfit, grossLoss,
    winRate, profitFactor, avgWin, avgLoss, avgRR, avgHoldingTime,
    totalVolume, totalFees, avgExecScore, avgDiscipline, emotions,
    longTrades, shortTrades, bestTrade, worstTrade, largestWin, largestLoss,
    avgReturn, maxDrawdown,
  };
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function formatCurrency(n: number) {
  return n >= 0 ? `+$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}` : `-$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

// ──────────────────────────────────────────────
// Widget Registry
// ──────────────────────────────────────────────
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Performance
  { id: "win-rate", name: "Win Rate", description: "Win/loss ratio with donut chart", category: "performance", icon: Target, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "net-pnl", name: "Net P&L", description: "Total net profit/loss", category: "performance", icon: DollarSign, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "gross-pnl", name: "Gross P&L", description: "Gross profit and loss breakdown", category: "performance", icon: Banknote, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "profit-factor", name: "Profit Factor", description: "Ratio of gross profit to gross loss", category: "performance", icon: Scale, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "avg-win-loss", name: "Avg Win / Avg Loss", description: "Average winning vs losing trade", category: "performance", icon: ArrowUpDown, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "expectancy", name: "Expectancy", description: "Expected value per trade", category: "performance", icon: Zap, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "best-worst-trade", name: "Best / Worst Trade", description: "Largest win and largest loss", category: "performance", icon: Trophy, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "avg-return-pct", name: "Avg Return %", description: "Average percentage return per trade", category: "performance", icon: Percent, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "trade-count", name: "Trade Count", description: "Total trades with win/loss breakdown", category: "performance", icon: Hash, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "win-loss-streak", name: "Win/Loss Streak", description: "Current and best streaks", category: "performance", icon: Flame, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "long-short-breakdown", name: "Long vs Short", description: "Performance by trade direction", category: "performance", icon: ArrowUpDown, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },

  // Risk
  { id: "avg-risk-reward", name: "Avg Risk/Reward", description: "Average R:R ratio across trades", category: "risk", icon: Crosshair, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "max-drawdown", name: "Max Drawdown", description: "Largest peak-to-trough decline", category: "risk", icon: AlertTriangle, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "risk-per-trade", name: "Risk Per Trade", description: "Average dollar risk per trade", category: "risk", icon: Shield, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "total-fees", name: "Total Fees", description: "Cumulative trading fees paid", category: "risk", icon: Banknote, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },

  // Execution
  { id: "avg-holding-time", name: "Avg Holding Time", description: "Average trade duration", category: "execution", icon: Clock, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "execution-score", name: "Execution Score", description: "Quality of trade executions", category: "execution", icon: Gauge, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "total-volume", name: "Total Volume", description: "Total trading volume in dollars", category: "execution", icon: Activity, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "trade-frequency", name: "Trade Frequency", description: "Average trades per day/week", category: "execution", icon: Timer, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },

  // Psychology
  { id: "discipline-score", name: "Discipline Score", description: "Average adherence to trading plan", category: "psychology", icon: Brain, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "emotion-breakdown", name: "Emotion Breakdown", description: "Distribution of emotional states", category: "psychology", icon: Brain, defaultW: 4, defaultH: 3, minW: 3, minH: 2 },

  // Charts
  { id: "chart-equity-curve", name: "Equity Curve", description: "Cumulative P&L over time", category: "charts", icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-daily-pnl", name: "Daily P&L Chart", description: "Bar chart of daily profits/losses", category: "charts", icon: BarChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-win-rate-over-time", name: "Win Rate Over Time", description: "Rolling win rate trend", category: "charts", icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-pnl-by-symbol", name: "P&L by Symbol", description: "Profit/loss grouped by ticker", category: "charts", icon: BarChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-pnl-by-day", name: "P&L by Day of Week", description: "Performance by weekday", category: "charts", icon: BarChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-trade-distribution", name: "Trade Distribution", description: "Histogram of trade returns", category: "charts", icon: BarChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-monthly-pnl", name: "Monthly P&L", description: "Month-by-month performance", category: "charts", icon: BarChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },

  // Strategy
  { id: "strategy-comparison", name: "Strategy Comparison", description: "Compare strategy performance side by side", category: "strategy", icon: Layers, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "strategy-win-rates", name: "Strategy Win Rates", description: "Win rate by strategy", category: "strategy", icon: Target, defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
  { id: "top-strategy", name: "Top Strategy", description: "Your best performing strategy", category: "strategy", icon: Award, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },

  // Account
  { id: "account-balance", name: "Account Balance", description: "Current account balance", category: "account", icon: Wallet, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "account-growth", name: "Account Growth %", description: "Percentage growth over time", category: "account", icon: TrendingUp, defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "chart-balance-history", name: "Balance History", description: "Account balance over time", category: "charts", icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
];

// ──────────────────────────────────────────────
// Widget Renderer
// ──────────────────────────────────────────────
export function renderWidget(widgetId: string) {
  const stats = computeStats();

  const chartColors = {
    success: "hsl(var(--success))",
    loss: "hsl(var(--loss))",
    primary: "hsl(var(--primary))",
    muted: "hsl(var(--muted))",
    accent: "hsl(var(--accent))",
  };

  switch (widgetId) {
    case "win-rate": {
      const data = [{ value: stats.winRate }, { value: 100 - stats.winRate }];
      return (
        <div className="flex items-center justify-between h-full">
          <div>
            <div className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-text-secondary mt-1">{stats.wins.length}W / {stats.losses.length}L</div>
            <div className="text-xs text-text-secondary">{stats.closed.length} Total</div>
          </div>
          <div className="w-20 h-20">
            <PieChart width={80} height={80}>
              <Pie data={data} cx={35} cy={35} innerRadius={22} outerRadius={32} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={chartColors.success} />
                <Cell fill={chartColors.muted} />
              </Pie>
            </PieChart>
          </div>
        </div>
      );
    }

    case "net-pnl":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-success" : "text-loss"}`}>
            {formatCurrency(stats.totalPnl)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {stats.totalPnl >= 0 ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-loss" />}
            <span className="text-xs text-text-secondary">Net across {stats.closed.length} trades</span>
          </div>
        </div>
      );

    case "gross-pnl":
      return (
        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-text-secondary">Profit</div>
              <div className="text-lg font-bold text-success">+${stats.grossProfit.toLocaleString()}</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xs text-text-secondary">Loss</div>
              <div className="text-lg font-bold text-loss">-${stats.grossLoss.toLocaleString()}</div>
            </div>
          </div>
        </div>
      );

    case "profit-factor":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.profitFactor >= 1 ? "text-success" : "text-loss"}`}>
            {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {stats.profitFactor >= 2 ? "Excellent" : stats.profitFactor >= 1 ? "Profitable" : "Unprofitable"}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(stats.profitFactor * 20, 100)}%` }} />
          </div>
        </div>
      );

    case "avg-win-loss":
      return (
        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-text-secondary">Avg Win</div>
              <div className="text-lg font-bold text-success">${stats.avgWin.toFixed(0)}</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xs text-text-secondary">Avg Loss</div>
              <div className="text-lg font-bold text-loss">${stats.avgLoss.toFixed(0)}</div>
            </div>
          </div>
          <div className="text-xs text-text-secondary mt-2">Ratio: {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : "∞"}x</div>
        </div>
      );

    case "expectancy": {
      const expectancy = (stats.winRate / 100) * stats.avgWin - ((100 - stats.winRate) / 100) * stats.avgLoss;
      return (
        <div>
          <div className={`text-2xl font-bold ${expectancy >= 0 ? "text-success" : "text-loss"}`}>
            {formatCurrency(expectancy)}
          </div>
          <div className="text-xs text-text-secondary mt-1">Expected per trade</div>
        </div>
      );
    }

    case "best-worst-trade":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Best</span>
            <span className="text-sm font-bold text-success">{stats.bestTrade ? formatCurrency(stats.bestTrade.netPnl) : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Worst</span>
            <span className="text-sm font-bold text-loss">{stats.worstTrade ? formatCurrency(stats.worstTrade.netPnl) : "—"}</span>
          </div>
          {stats.bestTrade && <div className="text-[10px] text-text-secondary">{stats.bestTrade.symbol} / {stats.worstTrade?.symbol}</div>}
        </div>
      );

    case "avg-return-pct":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.avgReturn >= 0 ? "text-success" : "text-loss"}`}>
            {stats.avgReturn.toFixed(2)}%
          </div>
          <div className="text-xs text-text-secondary mt-1">Average return per trade</div>
        </div>
      );

    case "trade-count":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{stats.closed.length}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-success" />
              <span className="text-xs text-foreground">{stats.wins.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown size={12} className="text-loss" />
              <span className="text-xs text-foreground">{stats.losses.length}</span>
            </div>
          </div>
        </div>
      );

    case "win-loss-streak":
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-success">2</div>
            <div className="text-[10px] text-text-secondary">Win Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-loss">1</div>
            <div className="text-[10px] text-text-secondary">Loss Streak</div>
          </div>
        </div>
      );

    case "long-short-breakdown": {
      const longPnl = stats.longTrades.reduce((s, t) => s + t.netPnl, 0);
      const shortPnl = stats.shortTrades.reduce((s, t) => s + t.netPnl, 0);
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Long ({stats.longTrades.length})</span>
            <span className={`text-sm font-bold ${longPnl >= 0 ? "text-success" : "text-loss"}`}>{formatCurrency(longPnl)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Short ({stats.shortTrades.length})</span>
            <span className={`text-sm font-bold ${shortPnl >= 0 ? "text-success" : "text-loss"}`}>{formatCurrency(shortPnl)}</span>
          </div>
        </div>
      );
    }

    case "avg-risk-reward":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{stats.avgRR.toFixed(2)}R</div>
          <div className="text-xs text-text-secondary mt-1">Average risk multiple</div>
        </div>
      );

    case "max-drawdown":
      return (
        <div>
          <div className="text-2xl font-bold text-loss">{formatCurrency(stats.maxDrawdown)}</div>
          <div className="text-xs text-text-secondary mt-1">Maximum single-trade drawdown</div>
        </div>
      );

    case "risk-per-trade": {
      const avgRisk = stats.closed.filter(t => t.riskAmount).reduce((s, t) => s + (t.riskAmount || 0), 0) / (stats.closed.filter(t => t.riskAmount).length || 1);
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">${avgRisk.toFixed(0)}</div>
          <div className="text-xs text-text-secondary mt-1">Avg risk per trade</div>
        </div>
      );
    }

    case "total-fees":
      return (
        <div>
          <div className="text-2xl font-bold text-loss">${stats.totalFees.toFixed(2)}</div>
          <div className="text-xs text-text-secondary mt-1">Total fees paid</div>
        </div>
      );

    case "avg-holding-time":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{formatDuration(stats.avgHoldingTime)}</div>
          <div className="text-xs text-text-secondary mt-1">Average duration</div>
          <div className="flex gap-3 mt-2">
            <div className="text-[10px] text-text-secondary">
              <span className="text-success">W:</span> {formatDuration(stats.wins.reduce((s, t) => s + (t.durationSeconds || 0), 0) / (stats.wins.length || 1))}
            </div>
            <div className="text-[10px] text-text-secondary">
              <span className="text-loss">L:</span> {formatDuration(stats.losses.reduce((s, t) => s + (t.durationSeconds || 0), 0) / (stats.losses.length || 1))}
            </div>
          </div>
        </div>
      );

    case "execution-score":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{(stats.avgExecScore * 100).toFixed(0)}%</div>
          <div className="text-xs text-text-secondary mt-1">Avg execution quality</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.avgExecScore * 100}%` }} />
          </div>
        </div>
      );

    case "total-volume":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">${(stats.totalVolume / 1000).toFixed(0)}K</div>
          <div className="text-xs text-text-secondary mt-1">Total volume traded</div>
        </div>
      );

    case "trade-frequency":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{stats.closed.length}</div>
          <div className="text-xs text-text-secondary mt-1">Trades this period</div>
          <div className="text-[10px] text-text-secondary mt-1">{(stats.closed.length / 4).toFixed(1)} avg/week</div>
        </div>
      );

    case "discipline-score":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{(stats.avgDiscipline * 100).toFixed(0)}%</div>
          <div className="text-xs text-text-secondary mt-1">Plan adherence</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${stats.avgDiscipline * 100}%` }} />
          </div>
        </div>
      );

    case "emotion-breakdown": {
      const emotionData = Object.entries(stats.emotions).map(([name, value]) => ({ name, value }));
      const emotionColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--loss))", "hsl(var(--accent))", "hsl(145 63% 49%)"];
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={emotionData} cx="50%" cy="50%" outerRadius="80%" dataKey="value" stroke="none" label={({ name }) => name}>
                  {emotionData.map((_, i) => <Cell key={i} fill={emotionColors[i % emotionColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    case "chart-equity-curve": {
      let cumulative = 0;
      const data = stats.closed.map((t, i) => {
        cumulative += t.netPnl;
        return { trade: i + 1, pnl: cumulative };
      });
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Area type="monotone" dataKey="pnl" stroke={chartColors.success} fill="url(#equityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-daily-pnl": {
      const byDate: Record<string, number> = {};
      stats.closed.forEach(t => {
        const d = t.entryDate.split("T")[0];
        byDate[d] = (byDate[d] || 0) + t.netPnl;
      });
      const data = Object.entries(byDate).sort().map(([date, pnl]) => ({ date: date.slice(5), pnl }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? chartColors.success : chartColors.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-win-rate-over-time": {
      const data = stats.closed.map((_, i) => {
        const slice = stats.closed.slice(0, i + 1);
        const w = slice.filter(t => t.netPnl > 0).length;
        return { trade: i + 1, winRate: (w / slice.length) * 100 };
      });
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Line type="monotone" dataKey="winRate" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 3, fill: chartColors.primary }} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-pnl-by-symbol": {
      const bySymbol: Record<string, number> = {};
      stats.closed.forEach(t => { bySymbol[t.symbol] = (bySymbol[t.symbol] || 0) + t.netPnl; });
      const data = Object.entries(bySymbol).map(([symbol, pnl]) => ({ symbol, pnl }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? chartColors.success : chartColors.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-pnl-by-day": {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const byDay: Record<string, number> = {};
      dayNames.forEach(d => byDay[d] = 0);
      stats.closed.forEach(t => {
        const day = dayNames[new Date(t.entryDate).getDay()];
        byDay[day] += t.netPnl;
      });
      const data = dayNames.map(day => ({ day, pnl: byDay[day] }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? chartColors.success : chartColors.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-trade-distribution": {
      const buckets: Record<string, number> = { "<-1K": 0, "-1K–0": 0, "0–1K": 0, "1K–5K": 0, ">5K": 0 };
      stats.closed.forEach(t => {
        if (t.netPnl < -1000) buckets["<-1K"]++;
        else if (t.netPnl < 0) buckets["-1K–0"]++;
        else if (t.netPnl < 1000) buckets["0–1K"]++;
        else if (t.netPnl < 5000) buckets["1K–5K"]++;
        else buckets[">5K"]++;
      });
      const data = Object.entries(buckets).map(([range, count]) => ({ range, count }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-monthly-pnl": {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const byMonth: Record<string, number> = {};
      months.forEach(m => byMonth[m] = 0);
      stats.closed.forEach(t => {
        const m = months[new Date(t.entryDate).getMonth()];
        byMonth[m] += t.netPnl;
      });
      const data = months.map(month => ({ month, pnl: byMonth[month] }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? chartColors.success : chartColors.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "strategy-comparison": {
      const data = sampleStrategies.map(s => ({
        name: s.name,
        pnl: s.metrics.netPnl,
        winRate: s.metrics.winRate,
        trades: s.metrics.totalTrades,
      }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? chartColors.success : chartColors.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "strategy-win-rates": {
      const data = sampleStrategies.map(s => ({ name: s.name, winRate: s.metrics.winRate }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--text-secondary))" }} width={100} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="winRate" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "top-strategy": {
      const best = sampleStrategies.reduce((b, s) => s.metrics.netPnl > b.metrics.netPnl ? s : b, sampleStrategies[0]);
      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{best.emoji}</span>
            <span className="text-sm font-semibold text-foreground">{best.name}</span>
          </div>
          <div className="text-lg font-bold text-success mt-1">{formatCurrency(best.metrics.netPnl)}</div>
          <div className="text-xs text-text-secondary">{best.metrics.winRate}% win rate • {best.metrics.totalTrades} trades</div>
        </div>
      );
    }

    case "account-balance":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">$100,000</div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={14} className="text-success" />
            <span className="text-xs text-success">+{formatCurrency(stats.totalPnl)}</span>
          </div>
        </div>
      );

    case "account-growth": {
      const growth = (stats.totalPnl / 100000) * 100;
      return (
        <div>
          <div className={`text-2xl font-bold ${growth >= 0 ? "text-success" : "text-loss"}`}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(2)}%
          </div>
          <div className="text-xs text-text-secondary mt-1">All-time growth</div>
        </div>
      );
    }

    case "chart-balance-history": {
      let balance = 100000;
      const data = stats.closed.map((t, i) => {
        balance += t.netPnl;
        return { trade: i + 1, balance };
      });
      data.unshift({ trade: 0, balance: 100000 });
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-secondary))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }} />
              <Area type="monotone" dataKey="balance" stroke={chartColors.primary} fill="url(#balGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return <div className="text-xs text-text-secondary">Widget not found</div>;
  }
}
