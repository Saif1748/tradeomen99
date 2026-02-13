import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
} from "recharts";
import { Info } from "@phosphor-icons/react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { format } from "date-fns";
import { Trade } from "@/types/trade";
import { useSettings } from "@/contexts/SettingsContext"; // ✅ 1. Import Settings
import { convertCurrency } from "@/services/currencyService"; // ✅ 2. Import Conversion Helper

// --- 1. Data Processing Engines (Updated for Currency) ---

const processEquityCurve = (trades: Trade[], rate: number) => {
  // Sort ascending by date
  const sorted = [...trades].sort((a, b) => {
     const dateA = a.entryDate instanceof Date ? a.entryDate : a.entryDate.toDate();
     const dateB = b.entryDate instanceof Date ? b.entryDate : b.entryDate.toDate();
     return dateA.getTime() - dateB.getTime();
  });
  
  let runningTotal = 0;
  const data = sorted.map(t => {
    runningTotal += (t.netPnl || 0);
    // Convert the cumulative total to the selected currency
    const convertedTotal = convertCurrency(runningTotal, rate);
    
    const entryDate = t.entryDate instanceof Date ? t.entryDate : t.entryDate.toDate();

    return {
      date: format(entryDate, "MMM dd"),
      value: Number(convertedTotal.toFixed(2)),
    };
  });

  // Ensure we have at least a start point if empty
  if (data.length === 0) return [{ date: format(new Date(), "MMM dd"), value: 0 }];
  return data;
};

const processDailyPnL = (trades: Trade[], rate: number) => {
  const dailyMap = new Map<string, number>();

  // Aggregate by Day (in USD first)
  trades.forEach(t => {
    const entryDate = t.entryDate instanceof Date ? t.entryDate : t.entryDate.toDate();
    const dateKey = format(entryDate, "MMM dd");
    const current = dailyMap.get(dateKey) || 0;
    dailyMap.set(dateKey, current + (t.netPnl || 0));
  });

  // Convert to Array, Convert Currency, & Slice
  return Array.from(dailyMap.entries())
    .map(([date, value]) => ({ 
      date, 
      value: convertCurrency(value, rate) // Convert daily total to local currency
    }))
    .slice(-10); // Show last 10 active trading days
};

const processRadarMetrics = (stats: any) => {
  // Ratios (Win %, Profit Factor) are currency-agnostic, so no conversion needed here.
  return [
    { subject: "Win %", value: Math.min(stats.winRate, 100), fullMark: 100 },
    { subject: "Profit Factor", value: Math.min(stats.profitFactor * 33, 100), fullMark: 100 }, // PF 3.0 = 100
    { subject: "Avg Win/Loss", value: Math.min(stats.avgWinLossRatio * 33, 100), fullMark: 100 }, // 3.0 = 100
    { subject: "Consistency", value: 75, fullMark: 100 }, 
    { subject: "Risk Mgmt", value: 85, fullMark: 100 },   
  ];
};

// --- 2. Chart Components ---

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, children }: ChartCardProps) => (
  <div className="glass-card card-glow p-5 rounded-2xl h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4 shrink-0">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <Info weight="light" className="w-3.5 h-3.5 text-muted-foreground/50" />
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export const PerformanceCharts = () => {
  // 🔥 Fetch Real Data
  const { trades, stats, isLoading } = useDashboardStats({ dateRange: "ALL" });
  
  // 💰 Get Currency Settings
  const { exchangeRate, getCurrencySymbol } = useSettings();
  const currencySymbol = getCurrencySymbol();

  // ⚡ Memoize Processing (Now depends on exchangeRate)
  const equityData = useMemo(() => processEquityCurve(trades, exchangeRate), [trades, exchangeRate]);
  const dailyData = useMemo(() => processDailyPnL(trades, exchangeRate), [trades, exchangeRate]);
  const radarData = useMemo(() => processRadarMetrics(stats), [stats]);

  // 🎨 Calculate Gradient Offset for P&L Curve
  const gradientOffset = () => {
    const dataMax = Math.max(...equityData.map((i) => i.value));
    const dataMin = Math.min(...equityData.map((i) => i.value));
  
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
  
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  // Helper for consistent chart labelling
  const formatChartValue = (val: number) => {
    // Basic formatting for axes (e.g. $1.5k) can be added here if needed
    return `${currencySymbol}${val.toLocaleString('en-US', { notation: "compact", maximumFractionDigits: 1 })}`;
  };
  
  const formatTooltipValue = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return <div className="h-[300px] w-full bg-secondary/10 rounded-xl animate-pulse" />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-8 h-auto lg:h-[320px]">
      
      {/* 1. Trading Score Radar 

[Image of Radar Chart Example]
 */}
      <ChartCard title="Trading Score">
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="hsl(270, 70%, 60%)"
                  fill="hsl(270, 70%, 60%)"
                  fillOpacity={0.3}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                   itemStyle={{ color: "hsl(var(--primary))" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Dynamic Score Badge */}
          <div className="flex items-center justify-center gap-2 mt-[-10px]">
            <span className="text-muted-foreground text-xs">Score:</span>
            <span className="text-xl font-bold text-primary">
               {Math.round((stats.winRate + (stats.profitFactor * 10)) / 2)}
            </span>
          </div>
        </div>
      </ChartCard>

      {/* 2. Cumulative P&L (Equity Curve)  */}
      <ChartCard title="Daily Net Cumulative P&L">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={off} stopColor="hsl(160, 70%, 45%)" stopOpacity={0.4} />
                  <stop offset={off} stopColor="hsl(0, 70%, 50%)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={formatChartValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(val: number) => [formatTooltipValue(val), "Equity"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(270, 70%, 60%)"
                strokeWidth={2}
                fill="url(#splitColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* 3. Net Daily P&L (Bar) 

[Image of Bar Chart Example]
 */}
      <ChartCard title="Net Daily P&L">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={formatChartValue}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(val: number) => [formatTooltipValue(val), "Net P&L"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar
                dataKey="value"
                fill="hsl(270, 70%, 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
};