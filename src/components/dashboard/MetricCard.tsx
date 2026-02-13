import { ReactNode } from "react";
import { Info } from "@phosphor-icons/react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  children?: ReactNode;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
}: MetricCardProps) => {
  return (
    <div className="glass-card p-5 flex flex-col card-glow hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Info weight="light" className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-sm font-medium mt-1 ${
                trend.positive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
};
