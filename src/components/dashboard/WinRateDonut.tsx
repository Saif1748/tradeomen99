interface WinRateDonutProps {
  wins: number;
  losses: number;
}

export const WinRateDonut = ({ wins, losses }: WinRateDonutProps) => {
  const total = wins + losses;
  const winPercentage = (wins / total) * 100;
  const circumference = 2 * Math.PI * 18;
  const winDasharray = (winPercentage / 100) * circumference;
  const lossDasharray = circumference - winDasharray;

  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        {/* Loss segment */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="hsl(0, 70%, 50%)"
          strokeWidth="6"
          strokeDasharray={`${lossDasharray} ${circumference}`}
          strokeDashoffset={-winDasharray}
          className="opacity-60"
        />
        {/* Win segment */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="hsl(160, 70%, 45%)"
          strokeWidth="6"
          strokeDasharray={`${winDasharray} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-foreground">
          {winPercentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
