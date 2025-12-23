import { Info } from "@phosphor-icons/react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
}: MetricCardProps) => {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-light text-muted-foreground">
            {title}
          </span>
          <Info weight="regular" className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-normal tracking-tight-premium text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-light text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {trend && trendValue && (
          <span
            className={`text-xs font-light px-2 py-1 rounded-lg ${
              trend === "up"
                ? "text-emerald-400 bg-emerald-400/10"
                : trend === "down"
                ? "text-rose-400 bg-rose-400/10"
                : "text-muted-foreground bg-secondary"
            }`}
          >
            {trend === "up" ? "+" : trend === "down" ? "" : ""}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
