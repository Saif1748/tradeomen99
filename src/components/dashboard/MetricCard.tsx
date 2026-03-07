import { TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, children, className = "" }: MetricCardProps) {
  return (
    <div className={`bg-card rounded-lg p-6 border border-border shadow-card min-h-[162px] flex flex-col justify-between ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

export function WinRateCard() {
  const data = [{ value: 0 }, { value: 100 }];
  return (
    <MetricCard title="Win Rate">
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
            <Pie
              data={data}
              cx={35}
              cy={35}
              innerRadius={25}
              outerRadius={35}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="hsl(var(--muted-foreground))" />
              <Cell fill="hsl(var(--secondary))" />
            </Pie>
          </PieChart>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground pr-[10px] pb-[10px]">
            0%
          </span>
        </div>
      </div>
    </MetricCard>
  );
}

export function PnLCard() {
  return (
    <MetricCard title="PnL">
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-foreground">0</span>
        <span className="text-sm text-muted-foreground">Net</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingDown size={14} className="text-success" />
        <span className="text-sm text-muted-foreground">0 Gross</span>
      </div>
    </MetricCard>
  );
}

export function AccountBalanceCard() {
  return (
    <MetricCard title="Account Balance">
      <span className="text-[28px] font-bold text-foreground">0</span>
      <div className="flex items-center gap-1 mt-2">
        <TrendingDown size={14} className="text-success" />
        <span className="text-sm text-muted-foreground">+0 Net PnL</span>
      </div>
    </MetricCard>
  );
}

export function TradeCountCard() {
  return (
    <MetricCard title="Trade Count">
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
    </MetricCard>
  );
}

export function ProfitFactorCard() {
  return (
    <MetricCard title="Profit Factor">
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
    </MetricCard>
  );
}

export function VolumeCard() {
  return (
    <MetricCard title="Volume">
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
    </MetricCard>
  );
}

export function AvgHoldingTimeCard() {
  return (
    <MetricCard title="Average Holding Time">
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
    </MetricCard>
  );
}

export function StreakCard() {
  return (
    <MetricCard title="Streak">
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
    </MetricCard>
  );
}

// Optionally, you can export a default component that groups them all together
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