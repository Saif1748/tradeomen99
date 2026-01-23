import { Info, TrendUp, TrendDown, Minus } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "positive" | "negative" | "neutral";
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
}: MetricCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    const iconClass = "w-3 h-3";
    switch (trend) {
      case "up":
        return <TrendUp weight="bold" className={iconClass} />;
      case "down":
        return <TrendDown weight="bold" className={iconClass} />;
      default:
        return <Minus weight="bold" className={iconClass} />;
    }
  };

  const getTrendStyles = () => {
    switch (trend) {
      case "up":
        return "text-[hsl(var(--metric-positive))] bg-[hsl(var(--metric-positive-muted))]";
      case "down":
        return "text-[hsl(var(--metric-negative))] bg-[hsl(var(--metric-negative-muted))]";
      default:
        return "text-[hsl(var(--metric-neutral))] bg-[hsl(var(--metric-neutral-muted))]";
    }
  };

  const getValueStyles = () => {
    switch (variant) {
      case "positive":
        return "text-[hsl(var(--metric-positive))]";
      case "negative":
        return "text-[hsl(var(--metric-negative))]";
      default:
        return "text-foreground";
    }
  };

  const getIconContainerStyles = () => {
    switch (variant) {
      case "positive":
        return "bg-[hsl(var(--metric-positive-muted))] text-[hsl(var(--metric-positive))]";
      case "negative":
        return "bg-[hsl(var(--metric-negative-muted))] text-[hsl(var(--metric-negative))]";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card card-glow p-4 sm:p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-normal-premium">
            {title}
          </span>
          <Info weight="regular" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/50 cursor-help" />
        </div>
        {icon && (
          <div className={`p-1.5 sm:p-2 rounded-lg ${getIconContainerStyles()}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between mt-auto gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-xl sm:text-2xl font-medium tracking-tight-premium truncate ${getValueStyles()}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {trend && trendValue && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shrink-0 ${getTrendStyles()}`}
          >
            {getTrendIcon()}
            {trend === "up" ? "+" : ""}{trendValue}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
