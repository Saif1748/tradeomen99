interface ProfitFactorGaugeProps {
  value: number;
  max?: number;
}

export const ProfitFactorGauge = ({ value, max = 3 }: ProfitFactorGaugeProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = 126; // Circumference for the arc
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative w-20 h-12">
      <svg viewBox="0 0 60 35" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 5 30 A 25 25 0 0 1 55 30"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 5 30 A 25 25 0 0 1 55 30"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(270, 70%, 60%)" />
            <stop offset="100%" stopColor="hsl(200, 70%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
