// src/pages/Dashboard.tsx
import { useState } from "react";
import { Copy } from "@phosphor-icons/react";
import { MetricCardV2 as MetricCard } from "@/components/dashboard/MetricCard";
import { ProfitFactorGauge } from "@/components/dashboard/ProfitFactorGauge";
import { WinRateDonut } from "@/components/dashboard/WinRateDonut";
import { AvgWinLossBar } from "@/components/dashboard/AvgWinLossBar";
import { PerformanceCharts } from "@/components/dashboard/PerformanceChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSettings } from "@/contexts/SettingsContext";
import { DateRange } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Timer,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "1M",  value: "1M" },
  { label: "3M",  value: "3M" },
  { label: "6M",  value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y",  value: "1Y" },
  { label: "ALL", value: "ALL" },
];

// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>("1M");

  const { stats, isLoading } = useDashboardStats({ dateRange });
  const { formatCurrency }   = useSettings();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton metric cards */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-8 w-48 bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Date Range Selector Row ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                dateRange === r.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Trade count badge */}
        <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
          {stats.totalTrades} closed trade{stats.totalTrades !== 1 ? "s" : ""} in period
        </div>
      </div>

      {/* ── Row 1: Core Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        {/* 1. Net P&L */}
        <MetricCard
          title="Net P&L"
          value={formatCurrency(stats.netPnl)}
          trend={{
            value: `${Math.abs(stats.periodChangePercent).toFixed(1)}%`,
            positive: stats.periodChangePercent >= 0,
          }}
          variant={stats.netPnl >= 0 ? "positive" : "negative"}
          icon={
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Copy weight="light" className="w-4 h-4 text-muted-foreground" />
            </div>
          }
        />

        {/* 2. Trade Expectancy */}
        <MetricCard
          title="Trade Expectancy"
          value={formatCurrency(stats.expectancy)}
          subtitle="Per trade"
          trend={{
            value: `${Math.abs(stats.expectancyChange).toFixed(1)}%`,
            positive: stats.expectancyChange >= 0,
          }}
          variant={stats.expectancy >= 0 ? "positive" : "negative"}
        />

        {/* 3. Profit Factor */}
        <MetricCard
          title="Profit Factor"
          value={stats.profitFactor >= 100 ? "∞" : stats.profitFactor.toFixed(2)}
          subtitle="Quality indicator"
        >
          <ProfitFactorGauge value={stats.profitFactor} />
        </MetricCard>

        {/* 4. Win Rate */}
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
        >
          <WinRateDonut wins={stats.winningTrades} losses={stats.losingTrades} />
        </MetricCard>

        {/* 5. Avg Win/Loss */}
        <MetricCard
          title="Avg Win/Loss"
          value={stats.avgWinLossRatio >= 100 ? "∞" : stats.avgWinLossRatio.toFixed(2)}
          subtitle="W:L ratio"
        >
          <AvgWinLossBar avgWin={stats.avgWin} avgLoss={stats.avgLoss} />
        </MetricCard>
      </div>

      {/* ── Row 2: Extended Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Max Drawdown */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-loss" />
            <span className="text-xs text-muted-foreground font-medium">Max Drawdown</span>
          </div>
          <div className="text-xl font-bold text-loss">{formatCurrency(stats.maxDrawdown)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Peak-to-trough decline</div>
        </div>

        {/* Avg Holding Time */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={13} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Avg Holding Time</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {formatHoldingTime(stats.avgHoldingTimeSeconds)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Closed trades only</div>
        </div>

        {/* Win Streak */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-success" />
            <span className="text-xs text-muted-foreground font-medium">Win Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-success">{stats.currentWinStreak}</span>
            <span className="text-xs text-muted-foreground">current</span>
            <span className="text-xs text-foreground font-medium">/ {stats.maxWinStreak} best</span>
          </div>
        </div>

        {/* Loss Streak */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={13} className="text-loss" />
            <span className="text-xs text-muted-foreground font-medium">Loss Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-loss">{stats.currentLossStreak}</span>
            <span className="text-xs text-muted-foreground">current</span>
            <span className="text-xs text-foreground font-medium">/ {stats.maxLossStreak} worst</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="mb-6">
        <PerformanceCharts />
      </div>

      {/* ── Bottom Section ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentTrades />
        <MiniCalendar />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatHoldingTime(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export default Dashboard;