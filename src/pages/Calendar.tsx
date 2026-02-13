import { useState, useMemo } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths
} from "date-fns";

// Services & Hooks
import { useDashboard } from "@/components/dashboard/DashboardLayout";
import { useTrades } from "@/hooks/useTrades";
import { useJournal } from "@/hooks/useJournal";
import { useStrategies } from "@/hooks/useStrategies";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings
import { convertCurrency } from "@/services/currencyService"; // ✅ 2. Import Conversion Service

// Components
import PageHeader from "@/components/dashboard/PageHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DayData, Trade } from "@/lib/calendarData";

const Calendar = () => {
  const { onMobileMenuOpen } = useDashboard();
  const { activeAccount } = useWorkspace();
  const { profile } = useUser();
  
  // ✅ 3. Get Currency Settings
  const { exchangeRate, getCurrencySymbol } = useSettings();
  const currencySymbol = getCurrencySymbol();

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [colorMode, setColorMode] = useState<'pnl' | 'winrate'>('pnl');

  // 🔥 1. Fetch REAL Data
  const { trades } = useTrades(activeAccount?.id, profile?.uid);
  const { notesMap, saveNote } = useJournal(activeAccount?.id, currentDate);
  const { strategies } = useStrategies(activeAccount?.id);

  // 🔥 2. Create Strategy Lookup Map (ID -> Name)
  const strategyMap = useMemo(() => {
    const map = new Map<string, string>();
    if (strategies) {
      strategies.forEach(s => map.set(s.id, s.name));
    }
    return map;
  }, [strategies]);

  // 🔥 3. Aggregate Real Data for the Calendar
  const monthData = useMemo(() => {
    const data = new Map<string, DayData>();
    
    // Calculate the grid range
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dateString = day.toDateString(); 

      // Filter trades for this specific day
      const dayTrades = trades.filter(t => {
        const entry = t.entryDate instanceof Date 
          ? t.entryDate 
          : (typeof t.entryDate.toDate === 'function' ? t.entryDate.toDate() : new Date(t.entryDate));
        return isSameDay(entry, day);
      });
      
      // Calculate Stats (Raw USD first)
      const rawTotalPnL = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
      
      // ✅ 4. Convert Daily P&L to Selected Currency
      const totalPnL = convertCurrency(rawTotalPnL, exchangeRate);

      const wins = dayTrades.filter(t => (t.netPnl || 0) > 0).length;
      const totalTrades = dayTrades.length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

      // Note from Journal
      const note = notesMap.get(dateKey);

      if (totalTrades > 0 || note) {
        // Map Firestore trades to Calendar interface
        const mappedTrades: Trade[] = dayTrades.map(t => {
          const entry = t.entryDate instanceof Date ? t.entryDate : t.entryDate.toDate();
          
          let exitTime = "-";
          if (t.exitDate) {
             const exit = t.exitDate instanceof Date ? t.exitDate : (typeof t.exitDate.toDate === 'function' ? t.exitDate.toDate() : null);
             if (exit) exitTime = format(exit, "HH:mm");
          }

          const strategyName = t.strategyId 
            ? (strategyMap.get(t.strategyId) || "Unknown Strategy") 
            : "Discretionary";

          return {
            id: t.id,
            symbol: t.symbol,
            direction: t.direction.toLowerCase() as 'long' | 'short',
            // ✅ Convert Trade P&L individually
            pnl: convertCurrency(t.netPnl || 0, exchangeRate),
            entryTime: format(entry, "HH:mm"),
            exitTime: exitTime,
            strategy: strategyName
          };
        });

        // Sort by PnL
        mappedTrades.sort((a, b) => b.pnl - a.pnl);
        const bestTrade = mappedTrades.length > 0 ? mappedTrades[0] : null;
        const worstTrade = mappedTrades.length > 0 ? mappedTrades[mappedTrades.length - 1] : null;

        // Determine Emotion (Logic works same for converted values)
        let emotion: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (totalPnL > 0) emotion = 'positive';
        if (totalPnL < 0) emotion = 'negative';

        // Best Strategy
        const strategyCount: Record<string, number> = {};
        mappedTrades.filter(t => t.pnl > 0).forEach(t => {
          strategyCount[t.strategy] = (strategyCount[t.strategy] || 0) + 1;
        });
        const bestStrategy = Object.keys(strategyCount).sort((a, b) => strategyCount[b] - strategyCount[a])[0] || "-";

        data.set(dateString, {
          date: day,
          trades: mappedTrades,
          totalPnL, // Now in Local Currency
          winRate,
          tradeCount: totalTrades,
          emotion,
          bestStrategy,
          bestTrade,
          worstTrade,
          note
        });
      }
    });

    return data;
  }, [currentDate, trades, notesMap, strategyMap, exchangeRate]); // ✅ Added exchangeRate dependency

  // 4. Calculate Header Stats
  const monthStats = useMemo(() => {
    const validDays = Array.from(monthData.values()).filter(d => isSameMonth(d.date, currentDate) && d.tradeCount > 0);
    
    if (validDays.length === 0) return { monthlyPnL: 0, winRate: 0, totalTrades: 0, tradingDays: 0 };

    // This sum is already in Local Currency because monthData is converted
    const monthlyPnL = validDays.reduce((sum, d) => sum + d.totalPnL, 0);
    const totalTrades = validDays.reduce((sum, d) => sum + d.tradeCount, 0);
    const totalWins = validDays.reduce((sum, d) => sum + (d.winRate * d.tradeCount / 100), 0);
    const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

    return {
      monthlyPnL,
      winRate,
      totalTrades,
      tradingDays: validDays.length
    };
  }, [monthData, currentDate]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ✅ 5. Updated Formatter for Local Currency
  const formatPnL = (val: number) => {
    // Uses global symbol + locale string
    return `${currencySymbol}${Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  // Handlers
  const handleSaveNote = (date: Date, note: string) => saveNote({ date, content: note });
  const prevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const nextMonth = () => setCurrentDate(d => addMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <>
      <PageHeader
        title="Calendar"
        icon={<CalendarBlank weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={onMobileMenuOpen}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 space-y-4 sm:space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
           <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
            <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5">Monthly P&L</span>
            {/* ✅ Updated P&L Display */}
            <span className={cn("text-lg sm:text-2xl font-semibold", monthStats.monthlyPnL >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {monthStats.monthlyPnL >= 0 ? "+" : "-"}{formatPnL(monthStats.monthlyPnL)}
            </span>
           </div>
           
           <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
             <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5">Win Rate</span>
             <span className="text-lg sm:text-2xl font-semibold text-foreground">{monthStats.winRate}%</span>
           </div>
           
           <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
             <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5">Trades</span>
             <span className="text-lg sm:text-2xl font-semibold text-foreground">{monthStats.totalTrades}</span>
           </div>
           
           <div className="glass-card p-3 sm:p-5 rounded-xl sm:rounded-2xl">
             <span className="text-[10px] sm:text-sm text-muted-foreground block mb-0.5">Active Days</span>
             <span className="text-lg sm:text-2xl font-semibold text-foreground">{monthStats.tradingDays}</span>
           </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="glass-card p-3 sm:p-6 rounded-xl sm:rounded-2xl">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-2 mb-4">
             <div className="flex items-center gap-1 sm:gap-3">
               <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 sm:h-9 sm:w-9">
                 <CaretLeft weight="bold" className="w-4 h-4" />
               </Button>
               <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-9 sm:w-9">
                 <CaretRight weight="bold" className="w-4 h-4" />
               </Button>
               <h2 className="text-base sm:text-xl font-semibold text-foreground ml-1 sm:ml-2">{monthName}</h2>
               <Button variant="ghost" size="sm" onClick={goToday} className="hidden sm:inline-flex ml-2 text-xs">Today</Button>
             </div>
             
             {/* Color Mode Toggle */}
             <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
                <button 
                  onClick={() => setColorMode('pnl')} 
                  className={cn("px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all", colorMode === 'pnl' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  P&L
                </button>
                <button 
                  onClick={() => setColorMode('winrate')} 
                  className={cn("px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all", colorMode === 'winrate' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Win Rate
                </button>
             </div>
          </div>

          <CalendarGrid
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            monthData={monthData}
            colorMode={colorMode}
            onSaveNote={handleSaveNote}
          />
        </div>
      </div>
    </>
  );
};

export default Calendar;