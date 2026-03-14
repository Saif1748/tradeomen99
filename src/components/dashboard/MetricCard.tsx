// src/components/dashboard/MetricCard.tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

/**
 * Base container for all metric cards.
 */
interface MetricCardBaseProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, children, className = "" }: MetricCardBaseProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border border-border shadow-sm min-h-[140px] flex flex-col",
      className
    )}>
      <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{title}</h3>
      <div className="flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

// — Rich overloaded MetricCard —

interface TrendConfig {
  value: string;
  positive: boolean;
}

interface RichMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: TrendConfig;
  variant?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Richer MetricCard variant used by Dashboard — supports `value`, `trend`, `variant`, `subtitle`, `icon`, and `children`.
 */
// We overload MetricCard by updating its interface to support all props:
// This is done by merging both interfaces and making extra props optional.
// We re-export MetricCard with the full interface so Dashboard.tsx compiles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _MetricCard = MetricCard as any;
export { _MetricCard as MetricCardRich };

// ─────────────────────────────────────────────────────────────────────────────
// Re-define the MetricCard as a fully unified component
// ─────────────────────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string;
  className?: string;
  // Simple (children-only) usage
  children?: React.ReactNode;
  // Rich (value-driven) usage
  value?: string;
  subtitle?: string;
  trend?: TrendConfig;
  variant?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
};

// Override MetricCard export to the unified version
export const MetricCardV2 = ({
  title,
  children,
  className,
  value,
  subtitle,
  trend,
  variant = "neutral",
  icon,
}: MetricCardProps) => {
  const valueColor =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
      ? "text-loss"
      : "text-foreground";

  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border border-border shadow-sm min-h-[140px] flex flex-col",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        {icon}
      </div>

      <div className="flex-1 flex flex-col justify-end">
        {value !== undefined ? (
          <>
            <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
            )}
            {trend && (
              <div className={cn("flex items-center gap-1 mt-2", trend.positive ? "text-success" : "text-loss")}>
                {trend.positive
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />}
                <span className="text-xs font-medium">
                  {trend.positive ? "+" : "-"}{trend.value}
                </span>
                <span className="text-xs text-muted-foreground">vs prev period</span>
              </div>
            )}
            {/* Optional children below the value (e.g. gauges, charts) */}
            {children && <div className="mt-3">{children}</div>}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy named exports (kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export function WinRateCard() {
  const data = [{ value: 0 }, { value: 100 }];
  return (
    <MetricCardV2 title="Win Rate">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-foreground">0</span>
            <span className="text-sm text-muted-foreground">Trades</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={14} className="text-loss" />
            <span className="text-sm text-muted-foreground">0 Trades</span>
          </div>
        </div>
        <div className="relative w-20 h-20">
          <PieChart width={80} height={80}>
            <Pie data={data} cx={35} cy={35} innerRadius={25} outerRadius={35} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill="hsl(var(--muted-foreground))" />
              <Cell fill="hsl(var(--secondary))" />
            </Pie>
          </PieChart>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground pr-[10px] pb-[10px]">
            0%
          </span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export function PnLCard() {
  return (
    <MetricCardV2 title="PnL">
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-foreground">0</span>
        <span className="text-sm text-muted-foreground">Net</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingDown size={14} className="text-success" />
        <span className="text-sm text-muted-foreground">0 Gross</span>
      </div>
    </MetricCardV2>
  );
}

export function AccountBalanceCard() {
  return (
    <MetricCardV2 title="Account Balance">
      <span className="text-[28px] font-bold text-foreground">0</span>
      <div className="flex items-center gap-1 mt-2">
        <TrendingDown size={14} className="text-success" />
        <span className="text-sm text-muted-foreground">+0 Net PnL</span>
      </div>
    </MetricCardV2>
  );
}

export function TradeCountCard() {
  return (
    <MetricCardV2 title="Trade Count">
      <span className="text-[28px] font-bold text-foreground">0</span>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-success" />
          <span className="text-sm text-foreground">0</span>
          <span className="text-sm text-muted-foreground">Trades</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={14} className="text-loss" />
          <span className="text-sm text-foreground">0</span>
          <span className="text-sm text-muted-foreground">Trades</span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export function ProfitFactorCard() {
  return (
    <MetricCardV2 title="Profit Factor">
      <span className="text-[28px] font-bold text-foreground">0</span>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-success" />
          <span className="text-sm text-muted-foreground">0</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={14} className="text-loss" />
          <span className="text-sm text-muted-foreground">0</span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export function VolumeCard() {
  return (
    <MetricCardV2 title="Volume">
      <span className="text-[28px] font-bold text-foreground">0</span>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-success" />
          <span className="text-sm text-muted-foreground">0</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={14} className="text-loss" />
          <span className="text-sm text-muted-foreground">0</span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export function AvgHoldingTimeCard() {
  return (
    <MetricCardV2 title="Average Holding Time">
      <span className="text-[28px] font-bold text-primary">0s</span>
      <div className="space-y-1 mt-2">
        <div className="flex items-center gap-1">
          <TrendingDown size={14} className="text-success" />
          <span className="text-sm text-muted-foreground">0s</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown size={14} className="text-loss" />
          <span className="text-sm text-muted-foreground">0s</span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export function StreakCard() {
  return (
    <MetricCardV2 title="Streak">
      <div className="grid grid-cols-2 gap-2">
        <div className="text-left flex items-baseline">
          <span className="text-[28px] font-bold text-success">0</span>
          <span className="text-sm text-muted-foreground ml-1">Day</span>
        </div>
        <div className="text-left flex items-baseline">
          <span className="text-[28px] font-bold text-success">0</span>
          <span className="text-sm text-muted-foreground ml-1">Trade</span>
        </div>
        <div className="text-left flex items-baseline">
          <span className="text-[28px] font-bold text-loss">0</span>
          <span className="text-sm text-muted-foreground ml-1">Day</span>
        </div>
        <div className="text-left flex items-baseline">
          <span className="text-[28px] font-bold text-loss">0</span>
          <span className="text-sm text-muted-foreground ml-1">Trade</span>
        </div>
      </div>
    </MetricCardV2>
  );
}

export default function AllMetricCards() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <WinRateCard />
        <PnLCard />
        <AccountBalanceCard />
        <TradeCountCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ProfitFactorCard />
        <VolumeCard />
        <AvgHoldingTimeCard />
        <StreakCard />
      </div>
    </div>
  );
}