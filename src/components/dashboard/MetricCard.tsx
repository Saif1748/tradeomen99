import { Info } from "@phosphor-icons/react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const normalizeValue = (val: string) => {
  if (!val || typeof val !== "string") return val;

  // Find first digit, sign or dot to split prefix (symbols / currency codes) from numeric part
  const firstIndex = val.search(/[0-9\-\+\.]/);
  if (firstIndex === -1) return val; // no digits found — nothing to do

  let prefix = val.slice(0, firstIndex);
  const core = val.slice(firstIndex);

  // Collapse repeated identical characters in prefix (e.g., "$$" -> "$")
  prefix = prefix.replace(/(.)\1+/g, "$1");

  // Collapse repeated words (e.g., "USD USD " -> "USD ")
  prefix = prefix.replace(/(\b\w+\b)(?:\s+\1)+/gi, "$1 ");

  // Trim trailing spaces
  prefix = prefix.trimEnd();

  return prefix + core;
};

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
}: MetricCardProps) => {
  const displayValue = normalizeValue(value);

  return (
    <div className="glass-card card-glow p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-light text-muted-foreground">
            {title}
          </span>
          <Info weight="regular" className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="flex items-end justify-between mt-auto">
        {/* min-w-0 allows the child to shrink properly inside a flex container so truncate works */}
        <div className="min-w-0">
          <p className="text-2xl font-normal tracking-tight-premium text-foreground truncate max-w-[12rem]">
            {displayValue}
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
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : trend === "down"
                ? "text-rose-600 dark:text-rose-400 bg-rose-500/10"
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
