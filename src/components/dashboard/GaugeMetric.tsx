import { Info } from "@phosphor-icons/react";

interface GaugeMetricProps {
  title: string;
  value: number;
  type: "arc" | "donut" | "bar";
  primaryColor?: string;
  secondaryColor?: string;
}

const GaugeMetric = ({
  title,
  value,
  type,
  primaryColor = "hsl(var(--primary))",
  secondaryColor = "hsl(var(--glow-secondary))",
}: GaugeMetricProps) => {
  const renderGauge = () => {
    switch (type) {
      case "arc":
        // Arc gauge for Profit Factor
        const arcPercentage = Math.min(value / 3, 1) * 100;
        return (
          <div className="relative w-20 h-10 overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Value arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${arcPercentage * 1.26} 126`}
              />
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      case "donut":
        // Donut gauge for Win Rate
        const circumference = 2 * Math.PI * 35;
        const dashOffset = circumference - (value / 100) * circumference;
        return (
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="10"
              />
              {/* Value circle */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="url(#donutGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
              <defs>
                <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={secondaryColor} />
                  <stop offset="100%" stopColor={primaryColor} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      case "bar":
        // Bar gauge for Avg Win/Loss
        const winWidth = Math.min((value / (value + 1)) * 100, 65);
        const lossWidth = 100 - winWidth;
        return (
          <div className="flex items-center gap-1 w-24">
            <div
              className="h-2 rounded-l-full bg-emerald-400"
              style={{ width: `${winWidth}%` }}
            />
            <div
              className="h-2 rounded-r-full bg-rose-400"
              style={{ width: `${lossWidth}%` }}
            />
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
        return `${value.toFixed(1)}%`;
      case "bar":
        return value.toFixed(1);
      default:
        return value;
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case "bar":
        return (
          <div className="flex gap-2 mt-1 text-[10px]">
            <span className="text-emerald-400">$52.40</span>
            <span className="text-rose-400">$28.60</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-light text-muted-foreground">{title}</span>
        <Info weight="regular" className="w-3.5 h-3.5 text-muted-foreground/60" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-normal tracking-tight-premium text-foreground">
            {getDisplayValue()}
          </p>
          {getSubtitle()}
        </div>
        {renderGauge()}
      </div>
    </div>
  );
};

export default GaugeMetric;
