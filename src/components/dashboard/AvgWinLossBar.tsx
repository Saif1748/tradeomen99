import { useSettings } from "@/contexts/SettingsContext";

interface AvgWinLossBarProps {
  avgWin: number;
  avgLoss: number;
}

export const AvgWinLossBar = ({ avgWin, avgLoss }: AvgWinLossBarProps) => {
  const { formatCurrency } = useSettings(); // ✅ Get global currency formatter

  const total = avgWin + avgLoss || 1; // Prevent division by zero
  const winWidth = (avgWin / total) * 100;
  const lossWidth = (avgLoss / total) * 100;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[120px]">
      {/* Visual Bar */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-secondary/30">
        <div
          className="bg-emerald-500 dark:bg-emerald-400 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${winWidth}%` }}
        />
        <div
          className="bg-rose-500 dark:bg-rose-400 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${lossWidth}%` }}
        />
      </div>

      {/* Currency Labels */}
      <div className="flex justify-between items-center text-[10px] font-medium leading-none">
        <span className="text-emerald-600 dark:text-emerald-400">
          {formatCurrency(avgWin)}
        </span>
        <span className="text-rose-600 dark:text-rose-400">
          {formatCurrency(avgLoss)}
        </span>
      </div>
    </div>
  );
};