// src/components/dashboard/widgetRegistry.tsx
import { useMemo } from "react";
import React from "react";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity,
  Target, Clock, Flame, PieChart as PieChartIcon, Percent,
  ArrowUpDown, Scale, Zap, Brain, Shield, Award, Calendar,
  LineChart, BarChart, Gauge, Hash, Layers,
  Timer, Crosshair, Trophy, AlertTriangle, Banknote, Wallet,
} from "lucide-react";
import {
  PieChart, Pie, Cell,
  BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart as ReLineChart, Line,
  AreaChart, Area,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useStrategies } from "@/hooks/useStrategies";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSettings } from "@/contexts/SettingsContext";
import { DateRange, DashboardMetrics } from "@/lib/analytics";
import { Trade } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { format } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetCategory =
  | "performance"
  | "risk"
  | "execution"
  | "psychology"
  | "charts"
  | "strategy"
  | "account";

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

export const CATEGORY_META: Record<WidgetCategory, { label: string; color: string }> = {
  performance: { label: "Performance",      color: "hsl(var(--success))" },
  risk:        { label: "Risk Management",  color: "hsl(var(--loss))" },
  execution:   { label: "Execution Quality",color: "hsl(var(--primary))" },
  psychology:  { label: "Psychology",       color: "hsl(145 63% 49%)" },
  charts:      { label: "Charts & Visuals", color: "hsl(var(--accent))" },
  strategy:    { label: "Strategy",         color: "hsl(262 83% 58%)" },
  account:     { label: "Account & Money",  color: "hsl(45 93% 47%)" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Widget Registry
// ─────────────────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Performance
  { id: "win-rate",            name: "Win Rate",            description: "Win/loss ratio with donut chart",           category: "performance", icon: Target,       defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "net-pnl",             name: "Net P&L",             description: "Total net profit/loss",                     category: "performance", icon: DollarSign,   defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "gross-pnl",           name: "Gross P&L",           description: "Gross profit and loss breakdown",           category: "performance", icon: Banknote,     defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "profit-factor",       name: "Profit Factor",       description: "Ratio of gross profit to gross loss",       category: "performance", icon: Scale,        defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "avg-win-loss",        name: "Avg Win / Avg Loss",  description: "Average winning vs losing trade",           category: "performance", icon: ArrowUpDown,  defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "expectancy",          name: "Expectancy",          description: "Expected value per trade",                  category: "performance", icon: Zap,          defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "best-worst-trade",    name: "Best / Worst Trade",  description: "Largest win and largest loss",              category: "performance", icon: Trophy,       defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "avg-return-pct",      name: "Avg Return %",        description: "Average percentage return per trade",       category: "performance", icon: Percent,      defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "trade-count",         name: "Trade Count",         description: "Total trades with win/loss breakdown",      category: "performance", icon: Hash,         defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "win-loss-streak",     name: "Win/Loss Streak",     description: "Current and best streaks",                 category: "performance", icon: Flame,        defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "long-short-breakdown",name: "Long vs Short",       description: "Performance by trade direction",            category: "performance", icon: ArrowUpDown,  defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  // Risk
  { id: "avg-risk-reward",     name: "Avg Risk/Reward",     description: "Average R:R ratio across trades",           category: "risk",        icon: Crosshair,    defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "max-drawdown",        name: "Max Drawdown",        description: "Largest peak-to-trough decline",           category: "risk",        icon: AlertTriangle,defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "risk-per-trade",      name: "Risk Per Trade",      description: "Average dollar risk per trade",             category: "risk",        icon: Shield,       defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "total-fees",          name: "Total Fees",          description: "Cumulative trading fees paid",              category: "risk",        icon: Banknote,     defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  // Execution
  { id: "avg-holding-time",    name: "Avg Holding Time",    description: "Average trade duration",                   category: "execution",   icon: Clock,        defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "total-volume",        name: "Total Volume",        description: "Total trading volume in dollars",           category: "execution",   icon: Activity,     defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "trade-frequency",     name: "Trade Frequency",     description: "Average trades per week",                  category: "execution",   icon: Timer,        defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  // Psychology
  { id: "discipline-score",    name: "Discipline Score",    description: "Average adherence to trading plan",         category: "psychology",  icon: Brain,        defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "emotion-breakdown",   name: "Emotion Breakdown",   description: "Distribution of emotional states",         category: "psychology",  icon: Brain,        defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
  // Charts
  { id: "chart-equity-curve",        name: "Equity Curve",          description: "Cumulative P&L over time",              category: "charts", icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-daily-pnl",           name: "Daily P&L Chart",       description: "Bar chart of daily profits/losses",     category: "charts", icon: BarChart,  defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-win-rate-over-time",  name: "Win Rate Over Time",    description: "Rolling win rate trend",                category: "charts", icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-pnl-by-symbol",       name: "P&L by Symbol",         description: "Profit/loss grouped by ticker",         category: "charts", icon: BarChart,  defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-pnl-by-day",          name: "P&L by Day of Week",    description: "Performance by weekday",                category: "charts", icon: BarChart,  defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-trade-distribution",  name: "Trade Distribution",    description: "Histogram of trade returns",            category: "charts", icon: BarChart3, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "chart-monthly-pnl",         name: "Monthly P&L",           description: "Month-by-month performance",            category: "charts", icon: BarChart,  defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  // Strategy
  { id: "strategy-comparison", name: "Strategy Comparison", description: "Compare strategy performance side by side", category: "strategy", icon: Layers, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { id: "strategy-win-rates",  name: "Strategy Win Rates",  description: "Win rate by strategy",                     category: "strategy", icon: Target, defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
  { id: "top-strategy",        name: "Top Strategy",        description: "Your best performing strategy",            category: "strategy", icon: Award,  defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  // Account
  { id: "account-balance",     name: "Account Balance",     description: "Current account balance",                  category: "account", icon: Wallet,    defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "account-growth",      name: "Account Growth %",    description: "Percentage growth over time",              category: "account", icon: TrendingUp,defaultW: 3, defaultH: 2, minW: 2, minH: 2 },
  { id: "chart-balance-history",name: "Balance History",    description: "Account balance over time",                category: "charts",  icon: LineChart, defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format seconds into human-readable duration string */
function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

const CHART_COLORS = {
  success: "hsl(var(--success))",
  loss:    "hsl(var(--loss))",
  primary: "hsl(var(--primary))",
  muted:   "hsl(var(--muted))",
  accent:  "hsl(var(--accent))",
};

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

// ─────────────────────────────────────────────────────────────────────────────
// useWidgetData — shared live data for all widgets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralised hook for widget live data. React Query de-duplicates all
 * requests so dozens of widgets on screen share a single network call.
 */
function useWidgetData(dateRange: DateRange) {
  const { activeAccount } = useWorkspace();
  const accountId = activeAccount?.id ?? "";

  const { stats, trades, isLoading } = useDashboardStats({ dateRange });
  const { strategies, isLoading: isLoadingStrategies } = useStrategies(accountId);
  const { formatCurrency, exchangeRate } = useSettings();

  // ── Derived chart data (all memoized) ────────────────────────────────────

  /** Equity curve: cumulative P&L sorted ascending by date */
  const equityCurveData = useMemo(() => {
    const sorted = [...trades].sort(
      (a, b) => toDate(a.entryDate).getTime() - toDate(b.entryDate).getTime()
    );
    let cumulative = 0;
    return sorted.map((t) => {
      cumulative += t.netPnl ?? 0;
      return { date: format(toDate(t.entryDate), "MMM dd"), pnl: Number(cumulative.toFixed(2)) };
    });
  }, [trades]);

  /** Daily P&L aggregation */
  const dailyPnlData = useMemo(() => {
    const byDate: Record<string, number> = {};
    trades.forEach((t) => {
      const key = format(toDate(t.entryDate), "MMM dd");
      byDate[key] = (byDate[key] ?? 0) + (t.netPnl ?? 0);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({ date, pnl: Number(pnl.toFixed(2)) }));
  }, [trades]);

  /** Rolling win rate over time */
  const winRateOverTimeData = useMemo(() => {
    const sorted = [...trades]
      .filter((t) => t.status === "CLOSED")
      .sort((a, b) => toDate(a.entryDate).getTime() - toDate(b.entryDate).getTime());
    return sorted.map((_, i) => {
      const slice = sorted.slice(0, i + 1);
      const wins = slice.filter((t) => (t.netPnl ?? 0) > 0).length;
      return { trade: i + 1, winRate: Number(((wins / slice.length) * 100).toFixed(1)) };
    });
  }, [trades]);

  /** P&L by symbol */
  const pnlBySymbolData = useMemo(() => {
    const bySymbol: Record<string, number> = {};
    trades.forEach((t) => {
      if (t.status === "CLOSED") {
        bySymbol[t.symbol] = (bySymbol[t.symbol] ?? 0) + (t.netPnl ?? 0);
      }
    });
    return Object.entries(bySymbol)
      .map(([symbol, pnl]) => ({ symbol, pnl: Number(pnl.toFixed(2)) }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 10);
  }, [trades]);

  /** P&L by day of week */
  const pnlByDayData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const byDay: Record<string, number> = {};
    dayNames.forEach((d) => { byDay[d] = 0; });
    trades.forEach((t) => {
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        toDate(t.entryDate).getDay()
      ];
      byDay[day] = (byDay[day] ?? 0) + (t.netPnl ?? 0);
    });
    return dayNames.map((day) => ({ day, pnl: Number(byDay[day].toFixed(2)) }));
  }, [trades]);

  /** Trade distribution histogram */
  const distributionData = useMemo(() => {
    const closed = trades.filter((t) => t.status === "CLOSED");
    const buckets: Record<string, number> = { "<-1K": 0, "-1K–0": 0, "0–1K": 0, "1K–5K": 0, ">5K": 0 };
    closed.forEach((t) => {
      const pnl = t.netPnl ?? 0;
      if (pnl < -1000) buckets["<-1K"]++;
      else if (pnl < 0) buckets["-1K–0"]++;
      else if (pnl < 1000) buckets["0–1K"]++;
      else if (pnl < 5000) buckets["1K–5K"]++;
      else buckets[">5K"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [trades]);

  /** Monthly P&L */
  const monthlyPnlData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const byMonth: Record<string, number> = {};
    months.forEach((m) => { byMonth[m] = 0; });
    trades.forEach((t) => {
      const m = months[toDate(t.entryDate).getMonth()];
      byMonth[m] = (byMonth[m] ?? 0) + (t.netPnl ?? 0);
    });
    return months.map((month) => ({ month, pnl: Number(byMonth[month].toFixed(2)) }));
  }, [trades]);

  /** Balance history (account balance over trades) */
  const balanceHistoryData = useMemo(() => {
    const startingBalance = activeAccount?.balance
      ? activeAccount.balance - (stats.netPnl ?? 0)
      : 100_000;
    const sorted = [...trades]
      .filter((t) => t.status === "CLOSED")
      .sort((a, b) => toDate(a.entryDate).getTime() - toDate(b.entryDate).getTime());
    let balance = startingBalance;
    const data = [{ trade: 0, balance }];
    sorted.forEach((t, i) => {
      balance += t.netPnl ?? 0;
      data.push({ trade: i + 1, balance: Number(balance.toFixed(2)) });
    });
    return data;
  }, [trades, stats.netPnl, activeAccount?.balance]);

  return {
    stats,
    trades,
    strategies,
    isLoading: isLoading || isLoadingStrategies,
    formatCurrency,
    exchangeRate,
    // Chart datasets
    equityCurveData,
    dailyPnlData,
    winRateOverTimeData,
    pnlBySymbolData,
    pnlByDayData,
    distributionData,
    monthlyPnlData,
    balanceHistoryData,
    // Account info
    accountBalance: activeAccount?.balance ?? 0,
  };
}

/** Safe Firestore Timestamp → Date converter */
function toDate(val: unknown): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (typeof (val as any).toDate === "function") return (val as any).toDate();
  return new Date(val as string | number);
}

// ─────────────────────────────────────────────────────────────────────────────
// WidgetRenderer — the public API for rendering any widget with live data
// ─────────────────────────────────────────────────────────────────────────────

interface WidgetRendererProps {
  widgetId: string;
  dateRange: DateRange;
}

/**
 * Renders a single dashboard widget powered by live Firestore data.
 * All 35 widget types are handled. All widgets in a view share the same
 * React Query cache entry — no duplicate network requests.
 *
 * @param widgetId  - One of the IDs defined in WIDGET_REGISTRY
 * @param dateRange - The active date filter for the dashboard
 */
export function WidgetRenderer({ widgetId, dateRange }: WidgetRendererProps) {
  const {
    stats, trades, strategies, isLoading, formatCurrency,
    equityCurveData, dailyPnlData, winRateOverTimeData,
    pnlBySymbolData, pnlByDayData, distributionData, monthlyPnlData,
    balanceHistoryData, accountBalance,
  } = useWidgetData(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (widgetId) {
    // ── Performance ─────────────────────────────────────────────────────────

    case "win-rate": {
      const data = [
        { value: stats.winRate },
        { value: 100 - stats.winRate },
      ];
      return (
        <div className="flex items-center justify-between h-full">
          <div>
            <div className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.winningTrades}W / {stats.losingTrades}L
            </div>
            <div className="text-xs text-muted-foreground">{stats.totalTrades} total</div>
          </div>
          <div className="w-20 h-20">
            <PieChart width={80} height={80}>
              <Pie data={data} cx={35} cy={35} innerRadius={22} outerRadius={32} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={CHART_COLORS.success} />
                <Cell fill={CHART_COLORS.muted} />
              </Pie>
            </PieChart>
          </div>
        </div>
      );
    }

    case "net-pnl":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.netPnl >= 0 ? "text-success" : "text-loss"}`}>
            {stats.netPnl >= 0 ? "+" : ""}{formatCurrency(stats.netPnl)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {stats.netPnl >= 0
              ? <TrendingUp size={14} className="text-success" />
              : <TrendingDown size={14} className="text-loss" />}
            <span className="text-xs text-muted-foreground">Across {stats.totalTrades} trades</span>
          </div>
          {stats.periodChangePercent !== 0 && (
            <div className={`text-xs mt-1 ${stats.periodChangePercent >= 0 ? "text-success" : "text-loss"}`}>
              {stats.periodChangePercent >= 0 ? "▲" : "▼"} {Math.abs(stats.periodChangePercent).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
      );

    case "gross-pnl":
      return (
        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Gross Profit</div>
              <div className="text-lg font-bold text-success">+{formatCurrency(stats.grossProfit)}</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xs text-muted-foreground">Gross Loss</div>
              <div className="text-lg font-bold text-loss">-{formatCurrency(stats.grossLoss)}</div>
            </div>
          </div>
        </div>
      );

    case "profit-factor":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.profitFactor >= 1 ? "text-success" : "text-loss"}`}>
            {stats.profitFactor >= 100 ? "∞" : stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.profitFactor >= 2 ? "Excellent" : stats.profitFactor >= 1.5 ? "Good" : stats.profitFactor >= 1 ? "Profitable" : "Unprofitable"}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.min((stats.profitFactor / 3) * 100, 100)}%` }} />
          </div>
        </div>
      );

    case "avg-win-loss":
      return (
        <div>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Avg Win</div>
              <div className="text-lg font-bold text-success">+{formatCurrency(stats.avgWin)}</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <div className="text-xs text-muted-foreground">Avg Loss</div>
              <div className="text-lg font-bold text-loss">-{formatCurrency(stats.avgLoss)}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Ratio: {stats.avgLoss > 0 ? stats.avgWinLossRatio.toFixed(2) : "∞"}x
          </div>
        </div>
      );

    case "expectancy":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.expectancy >= 0 ? "text-success" : "text-loss"}`}>
            {stats.expectancy >= 0 ? "+" : ""}{formatCurrency(stats.expectancy)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Expected per trade</div>
          {stats.expectancyChange !== 0 && (
            <div className={`text-xs mt-1 ${stats.expectancyChange >= 0 ? "text-success" : "text-loss"}`}>
              {stats.expectancyChange >= 0 ? "▲" : "▼"} {Math.abs(stats.expectancyChange).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
      );

    case "best-worst-trade":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Best ({stats.bestTradeSymbol})</span>
            <span className="text-sm font-bold text-success">+{formatCurrency(stats.bestTradePnl)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Worst ({stats.worstTradeSymbol})</span>
            <span className="text-sm font-bold text-loss">{formatCurrency(stats.worstTradePnl)}</span>
          </div>
        </div>
      );

    case "avg-return-pct":
      return (
        <div>
          <div className={`text-2xl font-bold ${stats.avgReturnPct >= 0 ? "text-success" : "text-loss"}`}>
            {stats.avgReturnPct >= 0 ? "+" : ""}{stats.avgReturnPct.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Average return per trade</div>
        </div>
      );

    case "trade-count":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-success" />
              <span className="text-xs text-foreground">{stats.winningTrades} wins</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown size={12} className="text-loss" />
              <span className="text-xs text-foreground">{stats.losingTrades} losses</span>
            </div>
          </div>
          {stats.breakEvenTrades > 0 && (
            <div className="text-xs text-muted-foreground mt-1">{stats.breakEvenTrades} breakeven</div>
          )}
        </div>
      );

    case "win-loss-streak":
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-success/10">
            <div className="text-lg font-bold text-success">{stats.currentWinStreak}</div>
            <div className="text-[10px] text-muted-foreground">Win Streak</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-loss/10">
            <div className="text-lg font-bold text-loss">{stats.currentLossStreak}</div>
            <div className="text-[10px] text-muted-foreground">Loss Streak</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <div className="text-lg font-bold text-foreground">{stats.maxWinStreak}</div>
            <div className="text-[10px] text-muted-foreground">Best Win</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <div className="text-lg font-bold text-foreground">{stats.maxLossStreak}</div>
            <div className="text-[10px] text-muted-foreground">Best Loss</div>
          </div>
        </div>
      );

    case "long-short-breakdown":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Long ({stats.longTradesCount})</span>
            <span className={`text-sm font-bold ${stats.longPnl >= 0 ? "text-success" : "text-loss"}`}>
              {stats.longPnl >= 0 ? "+" : ""}{formatCurrency(stats.longPnl)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Short ({stats.shortTradesCount})</span>
            <span className={`text-sm font-bold ${stats.shortPnl >= 0 ? "text-success" : "text-loss"}`}>
              {stats.shortPnl >= 0 ? "+" : ""}{formatCurrency(stats.shortPnl)}
            </span>
          </div>
        </div>
      );

    // ── Risk ────────────────────────────────────────────────────────────────

    case "avg-risk-reward":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{stats.avgRR.toFixed(2)}R</div>
          <div className="text-xs text-muted-foreground mt-1">Average realized R-multiple</div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((stats.avgRR / 3) * 100, 100)}%` }} />
          </div>
        </div>
      );

    case "max-drawdown":
      return (
        <div>
          <div className="text-2xl font-bold text-loss">{formatCurrency(stats.maxDrawdown)}</div>
          <div className="text-xs text-muted-foreground mt-1">Peak-to-trough max drawdown</div>
        </div>
      );

    case "risk-per-trade":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgRiskPerTrade)}</div>
          <div className="text-xs text-muted-foreground mt-1">Average risk per trade</div>
        </div>
      );

    case "total-fees":
      return (
        <div>
          <div className="text-2xl font-bold text-loss">-{formatCurrency(stats.totalFees)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total trading fees</div>
        </div>
      );

    // ── Execution ───────────────────────────────────────────────────────────

    case "avg-holding-time":
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{formatDuration(stats.avgHoldingTimeSeconds)}</div>
          <div className="text-xs text-muted-foreground mt-1">Average trade duration (closed trades)</div>
        </div>
      );

    case "total-volume":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalVolume)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total volume traded</div>
        </div>
      );

    case "trade-frequency": {
      const weeksInRange = dateRange === "1M" ? 4 : dateRange === "3M" ? 13 : dateRange === "6M" ? 26 : dateRange === "YTD" ? 52 : dateRange === "1Y" ? 52 : 52;
      const perWeek = weeksInRange > 0 ? (stats.totalTrades / weeksInRange).toFixed(1) : "—";
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
          <div className="text-xs text-muted-foreground mt-1">Trades this period</div>
          <div className="text-xs text-muted-foreground mt-1">{perWeek} avg/week</div>
        </div>
      );
    }

    // ── Psychology (discipline/emotion come from trade fields — shown as averages) ──

    case "discipline-score": {
      // disciplineScore is a 0–1 field on individual trades
      const tradesWithScore = trades.filter((t) => t.disciplineScore !== undefined);
      const avgScore = tradesWithScore.length > 0
        ? tradesWithScore.reduce((s, t) => s + (t.disciplineScore ?? 0), 0) / tradesWithScore.length
        : 0;
      const pct = Math.round(avgScore * 100);
      return (
        <div>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            Plan adherence ({tradesWithScore.length} rated)
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }

    case "emotion-breakdown": {
      const emotionMap: Record<string, number> = {};
      trades.forEach((t) => {
        if (t.emotion) emotionMap[t.emotion] = (emotionMap[t.emotion] ?? 0) + 1;
      });
      const emotionData = Object.entries(emotionMap).map(([name, value]) => ({ name, value }));
      const emotionColors = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.loss, CHART_COLORS.accent, "hsl(145 63% 49%)"];

      if (emotionData.length === 0) {
        return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No emotion data logged yet</div>;
      }
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={emotionData} cx="50%" cy="50%" outerRadius="80%" dataKey="value" stroke="none" label={({ name }) => name}>
                  {emotionData.map((_, i) => <Cell key={i} fill={emotionColors[i % emotionColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // ── Charts ──────────────────────────────────────────────────────────────

    case "chart-equity-curve": {
      if (equityCurveData.length === 0) return <EmptyChartPlaceholder label="No closed trades yet" />;
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData}>
              <defs>
                <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="pnl" stroke={CHART_COLORS.success} fill="url(#eq-grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-daily-pnl": {
      if (dailyPnlData.length === 0) return <EmptyChartPlaceholder label="No trade data yet" />;
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={dailyPnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dailyPnlData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.success : CHART_COLORS.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-win-rate-over-time": {
      if (winRateOverTimeData.length === 0) return <EmptyChartPlaceholder label="No closed trades yet" />;
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={winRateOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="winRate" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-pnl-by-symbol": {
      if (pnlBySymbolData.length === 0) return <EmptyChartPlaceholder label="No closed trades yet" />;
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={pnlBySymbolData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {pnlBySymbolData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.success : CHART_COLORS.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "chart-pnl-by-day":
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={pnlByDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {pnlByDayData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.success : CHART_COLORS.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );

    case "chart-trade-distribution":
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );

    case "chart-monthly-pnl":
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={monthlyPnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPnlData.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.success : CHART_COLORS.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );

    // ── Strategy ────────────────────────────────────────────────────────────

    case "strategy-comparison": {
      if (strategies.length === 0) return <EmptyChartPlaceholder label="No strategies linked to trades" />;
      const data = strategies.map((s) => ({
        name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
        pnl: s.metrics?.totalPnl ?? 0,
      }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.success : CHART_COLORS.loss} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "strategy-win-rates": {
      if (strategies.length === 0) return <EmptyChartPlaceholder label="No strategies yet" />;
      const data = strategies.map((s) => ({
        name: s.name.length > 15 ? s.name.slice(0, 15) + "…" : s.name,
        winRate: s.metrics?.winRate ?? 0,
      }));
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="winRate" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    case "top-strategy": {
      if (strategies.length === 0) {
        return <EmptyChartPlaceholder label="No strategies yet" />;
      }
      const best = strategies.reduce<Strategy | null>((b, s) =>
        !b || (s.metrics?.totalPnl ?? 0) > (b.metrics?.totalPnl ?? 0) ? s : b, null);
      if (!best) return <EmptyChartPlaceholder label="No strategy data" />;
      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{best.emoji ?? "📊"}</span>
            <span className="text-sm font-semibold text-foreground">{best.name}</span>
          </div>
          <div className={`text-lg font-bold mt-1 ${(best.metrics?.totalPnl ?? 0) >= 0 ? "text-success" : "text-loss"}`}>
            {(best.metrics?.totalPnl ?? 0) >= 0 ? "+" : ""}{formatCurrency(best.metrics?.totalPnl ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            {(best.metrics?.winRate ?? 0).toFixed(1)}% win rate · {best.metrics?.totalTrades ?? 0} trades
          </div>
        </div>
      );
    }

    // ── Account ─────────────────────────────────────────────────────────────

    case "account-balance":
      return (
        <div>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(accountBalance)}</div>
          <div className="flex items-center gap-1 mt-2">
            {stats.netPnl >= 0
              ? <TrendingUp size={14} className="text-success" />
              : <TrendingDown size={14} className="text-loss" />}
            <span className={`text-xs ${stats.netPnl >= 0 ? "text-success" : "text-loss"}`}>
              {stats.netPnl >= 0 ? "+" : ""}{formatCurrency(stats.netPnl)} net P&L
            </span>
          </div>
        </div>
      );

    case "account-growth": {
      const startingBalance = accountBalance - stats.netPnl;
      const growth = startingBalance > 0 ? (stats.netPnl / startingBalance) * 100 : 0;
      return (
        <div>
          <div className={`text-2xl font-bold ${growth >= 0 ? "text-success" : "text-loss"}`}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Account growth this period</div>
        </div>
      );
    }

    case "chart-balance-history": {
      if (balanceHistoryData.length <= 1) return <EmptyChartPlaceholder label="No closed trades yet" />;
      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistoryData}>
              <defs>
                <linearGradient id="bal-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="balance" stroke={CHART_COLORS.primary} fill="url(#bal-grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    default:
      return (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Widget not implemented
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Empty chart placeholder
// ─────────────────────────────────────────────────────────────────────────────

function EmptyChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy shim — keeps any code that still calls renderWidget() working
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use <WidgetRenderer widgetId={id} dateRange={range} /> instead.
 */
export function renderWidget(widgetId: string) {
  return <WidgetRenderer widgetId={widgetId} dateRange="1M" />;
}
