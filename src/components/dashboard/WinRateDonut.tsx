interface WinRateDonutProps {
  wins: number;
  losses: number;
}

export const WinRateDonut = ({ wins, losses }: WinRateDonutProps) => {
  // Make inputs safe (handles undefined, NaN, negative numbers)
  const safeWins = Number.isFinite(wins) && wins > 0 ? wins : 0;
  const safeLosses = Number.isFinite(losses) && losses > 0 ? losses : 0;

  const total = safeWins + safeLosses;

  // avoid division by zero
  const winPercentage = total > 0 ? (safeWins / total) * 100 : 0;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  // lengths for stroke-dasharray must be finite numbers
  const winLength = Number.isFinite(winPercentage)
    ? (winPercentage / 100) * circumference
    : 0;
  const lossLength = Math.max(0, circumference - winLength);

  // Cast to strings to make React happy and ensure no NaN is passed in
  const winDasharray = `${winLength} ${circumference}`;
  const lossDasharray = `${lossLength} ${circumference}`;
  const winDashoffset = `${-winLength}`;

  const displayPercentage = Math.round(winPercentage);

  return (
    <div className="relative w-16 h-16" role="img" aria-label={`Win rate ${displayPercentage} percent`}>
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90" aria-hidden>
        {/* Neutral/background ring when there are no trades */}
        {total === 0 ? (
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="hsl(220, 8%, 92%)"
            strokeWidth="6"
            strokeDasharray={`${circumference} ${circumference}`}
            className="opacity-60"
          />
        ) : (
          <>
            {/* Loss segment (background for wins) */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="hsl(0, 70%, 50%)"
              strokeWidth="6"
              strokeDasharray={lossDasharray}
              strokeDashoffset={winDashoffset}
              className="opacity-60"
            />
            {/* Win segment */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="hsl(160, 70%, 45%)"
              strokeWidth="6"
              strokeDasharray={winDasharray}
              strokeDashoffset="0"
              className="transition-all duration-700"
            />
          </>
        )}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-foreground">
          {displayPercentage}%
        </span>
      </div>
    </div>
  );
};
