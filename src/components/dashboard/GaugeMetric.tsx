import { Info } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface GaugeMetricProps {
  title: string;
  value: number;
  type: "arc" | "donut" | "bar";
  compact?: boolean;
}

const GaugeMetric = ({
  title,
  value,
  type,
  compact = false,
}: GaugeMetricProps) => {
  // Determine quality level for color coding
  const getQualityLevel = () => {
    switch (type) {
      case "arc": // Profit Factor: <1 bad, 1-2 ok, >2 good
        if (value < 1) return "negative";
        if (value >= 2) return "positive";
        return "neutral";
      case "donut": // Win Rate: <40 bad, 40-60 ok, >60 good
        if (value < 40) return "negative";
        if (value >= 60) return "positive";
        return "neutral";
      case "bar": // Avg Win/Loss: <1 bad, 1-1.5 ok, >1.5 good
        if (value < 1) return "negative";
        if (value >= 1.5) return "positive";
        return "neutral";
      default:
        return "neutral";
    }
  };

  const quality = getQualityLevel();

  const getGradientColors = () => {
    switch (quality) {
      case "positive":
        return { start: "hsl(152 65% 45%)", end: "hsl(152 70% 55%)" };
      case "negative":
        return { start: "hsl(0 65% 50%)", end: "hsl(0 70% 60%)" };
      default:
        return { start: "hsl(var(--primary))", end: "hsl(var(--glow-secondary))" };
    }
  };

  const colors = getGradientColors();

  const renderGauge = () => {
    const uniqueId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case "arc":
        const arcPercentage = Math.min(value / 3, 1) * 100;
        return (
          <div className={`relative ${compact ? 'w-16 h-8' : 'w-20 h-10'} overflow-hidden`}>
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <motion.path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={`url(#${uniqueId})`}
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 126" }}
                animate={{ strokeDasharray: `${arcPercentage * 1.26} 126` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.start} />
                  <stop offset="100%" stopColor={colors.end} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      case "donut":
        const circumference = 2 * Math.PI * 35;
        const targetOffset = circumference - (value / 100) * circumference;
        return (
          <div className={`relative ${compact ? 'w-14 h-14' : 'w-16 h-16'}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="12"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke={`url(#${uniqueId})`}
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: targetOffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.end} />
                  <stop offset="100%" stopColor={colors.start} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center value for donut */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-semibold ${
                quality === "positive" ? "text-[hsl(var(--metric-positive))]" :
                quality === "negative" ? "text-[hsl(var(--metric-negative))]" :
                "text-foreground"
              }`}>
                {value.toFixed(0)}%
              </span>
            </div>
          </div>
        );

      case "bar":
        const winWidth = Math.min((value / (value + 1)) * 100, 70);
        const lossWidth = 100 - winWidth;
        return (
          <div className={`${compact ? 'w-20' : 'w-24'} space-y-1`}>
            <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
              <motion.div
                className="h-full bg-gradient-to-r from-[hsl(152_65%_45%)] to-[hsl(152_70%_55%)]"
                initial={{ width: 0 }}
                animate={{ width: `${winWidth}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="h-full bg-gradient-to-r from-[hsl(0_65%_50%)] to-[hsl(0_70%_60%)]"
                initial={{ width: 0 }}
                animate={{ width: `${lossWidth}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            {!compact && (
              <div className="flex justify-between text-[9px] font-medium">
                <span className="text-[hsl(var(--metric-positive))]">Win</span>
                <span className="text-[hsl(var(--metric-negative))]">Loss</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getDisplayValue = () => {
    switch (type) {
      case "arc":
        return value.toFixed(2);
      case "donut":
        return `${value.toFixed(compact ? 0 : 1)}%`;
      case "bar":
        return `${value.toFixed(2)}x`;
      default:
        return value;
    }
  };

  const getValueColor = () => {
    switch (quality) {
      case "positive":
        return "text-[hsl(var(--metric-positive))]";
      case "negative":
        return "text-[hsl(var(--metric-negative))]";
      default:
        return "text-foreground";
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-3 rounded-xl"
      >
        <div className="flex flex-col items-center text-center gap-1">
          {renderGauge()}
          <p className={`text-base sm:text-lg font-semibold tracking-tight ${getValueColor()}`}>
            {type === "donut" ? "" : getDisplayValue()}
          </p>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{title}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card card-glow p-4 sm:p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col"
    >
      <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-normal-premium">{title}</span>
        <Info weight="regular" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/50 cursor-help" />
      </div>
      <div className="flex items-center justify-between mt-auto gap-3">
        <div>
          <p className={`text-xl sm:text-2xl font-medium tracking-tight-premium ${getValueColor()}`}>
            {getDisplayValue()}
          </p>
          {type === "bar" && (
            <div className="flex gap-2 mt-1 text-[10px] font-medium">
              <span className="text-[hsl(var(--metric-positive))]">$52.40</span>
              <span className="text-[hsl(var(--metric-negative))]">$28.60</span>
            </div>
          )}
        </div>
        {renderGauge()}
      </div>
    </motion.div>
  );
};

export default GaugeMetric;
