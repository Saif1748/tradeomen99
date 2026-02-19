import { useEffect, useState } from "react";
import { CaretUp, CaretDown, TrendUp, TrendDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade, computeTradeData } from "@/lib/tradesData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Import Currency Services & Context
import { getExchangeRates, convertCurrency, ExchangeRates } from "@/services/currencyService";
import { useSettings } from "@/contexts/SettingsContext";

interface TradesTableProps {
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  isLoading?: boolean;
  // ✅ NEW Pagination Props
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TradesTable = ({ 
  trades, 
  onTradeClick, 
  sortField, 
  sortDirection, 
  onSort,
  // Pagination Destructuring
  totalCount,
  pageIndex,
  pageSize,
  setPageSize,
  nextPage,
  prevPage,
  hasNextPage,
  hasPrevPage
}: TradesTableProps) => {
  
  // ✅ 1. Currency State
  const { tradingPreferences } = useSettings();
  const [rates, setRates] = useState<ExchangeRates>({});
  const targetCurrency = tradingPreferences.currency || "USD";

  // ✅ 2. Fetch Rates on Mount
  useEffect(() => {
    const fetchRates = async () => {
      const data = await getExchangeRates();
      setRates(data);
    };
    fetchRates();
  }, []);

  // ✅ 3. Helper: Convert & Format Currency
  const formatMoney = (amount: number) => {
    const rate = rates[targetCurrency] || 1;
    const converted = convertCurrency(amount, rate);
    
    return converted.toLocaleString("en-US", { 
      style: 'currency', 
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Grid Layout Class (Preserved)
  const gridLayout = "grid-cols-[minmax(90px,1fr)_minmax(120px,1.5fr)_minmax(90px,1fr)_minmax(80px,0.8fr)_minmax(80px,1fr)_minmax(100px,1.2fr)_minmax(100px,1.2fr)_minmax(70px,0.8fr)_minmax(110px,1.2fr)_minmax(90px,1fr)]";

  const columns = [
    { key: "entryDate", label: "Date", sortable: true, align: "justify-start text-left" },
    { key: "symbol", label: "Symbol", sortable: true, align: "justify-start text-left" },
    { key: "status", label: "Status", sortable: true, align: "justify-start text-left" },
    { key: "direction", label: "Side", sortable: true, align: "justify-start text-left" },
    { key: "netQuantity", label: "Qty", sortable: true, align: "justify-end text-right" },
    { key: "avgEntryPrice", label: "Avg Entry", sortable: true, align: "justify-end text-right" },
    { key: "avgExitPrice", label: "Avg Exit", sortable: true, align: "justify-end text-right" },
    { key: "durationSeconds", label: "Hold", sortable: true, align: "justify-center text-center" },
    { key: "netPnl", label: "Return", sortable: true, align: "justify-end text-right" },
    { key: "returnPercent", label: "Return %", sortable: true, align: "justify-end text-right" },
  ];

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1.5 inline-flex flex-col opacity-20 hover:opacity-50 transition-opacity">
          <CaretUp weight="bold" className="w-2 h-2 -mb-0.5" />
          <CaretDown weight="bold" className="w-2 h-2 -mt-0.5" />
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <CaretUp weight="bold" className="w-3 h-3 ml-1.5 inline text-primary animate-in fade-in zoom-in duration-200" />
    ) : (
      <CaretDown weight="bold" className="w-3 h-3 ml-1.5 inline text-primary animate-in fade-in zoom-in duration-200" />
    );
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col">
      {/* Desktop Table */}
      <div className="hidden lg:flex flex-col w-full h-full">
        <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-4">
          <div className="min-w-[1000px] space-y-2">
            
            {/* Header Row */}
            <div className="bg-card/40 border border-border/60 rounded-xl px-5 py-3.5 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <div className={`grid ${gridLayout} gap-4 items-center`}>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`flex items-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest ${col.align} ${
                      col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors group" : "cursor-default"
                    }`}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Trade Rows */}
            <div className="space-y-1.5">
              {trades.map((trade) => {
                const c = computeTradeData(trade);
                const isWin = (c.pnl ?? 0) > 0;
                const isLoss = (c.pnl ?? 0) < 0;

                const entryDate: Date | null | undefined = (c as any).firstExecutionDate ?? (c as any).entryDate ?? null;
                const entryDateDisplay = entryDate ? format(entryDate, "MMM d") : "—";

                const instr = (c.instrumentType || "").toString();
                const instrShort = instr ? instr.substring(0, 3) : "";

                const totalQty = Number(c.totalQuantity || 0);
                const avgEntry = Number(c.avgEntryPrice || 0);
                const entryTotal = avgEntry * totalQty;
                const returnPct = entryTotal > 0 ? ((Number(c.pnl || 0) / entryTotal) * 100) : 0;

                return (
                  <div
                    key={trade.id}
                    className="bg-card border border-border/40 rounded-xl px-5 py-3 cursor-pointer hover:bg-secondary/40 hover:border-border/80 hover:shadow-sm transition-all duration-200 group active:scale-[0.998]"
                    onClick={() => onTradeClick(trade)}
                  >
                    <div className={`grid ${gridLayout} gap-4 items-center`}>
                      
                      {/* Date */}
                      <span className="text-sm text-muted-foreground tabular-nums font-medium">
                        {entryDateDisplay}
                      </span>

                      {/* Symbol */}
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-sm font-bold text-foreground truncate">
                          {trade.symbol}
                        </span>
                        <Badge variant="secondary" className="px-1.5 h-5 text-[9px] font-bold bg-secondary/80 text-muted-foreground border-transparent uppercase tracking-wider hidden xl:inline-flex">
                          {instrShort}
                        </Badge>
                      </div>

                      {/* Status */}
                      {(() => {
                        const status = ((c.status || "") as string).toString().toUpperCase();
                        const dotClass =
                          status === "OPEN" ? "bg-blue-500 shadow-blue-500/40" :
                          isWin ? "bg-emerald-500 shadow-emerald-500/40" :
                          isLoss ? "bg-rose-500 shadow-rose-500/40" :
                          "bg-muted-foreground";

                        const textClass =
                          status === "OPEN" ? "text-blue-500" :
                          isWin ? "text-emerald-500" :
                          isLoss ? "text-rose-500" :
                          "text-muted-foreground";

                        return (
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${dotClass}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-wide ${textClass}`}>
                              {status}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Side */}
                      <div>
                        {((c.direction || "") as string).toUpperCase() === "LONG" ? (
                          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md w-fit border border-emerald-500/10">
                             <TrendUp weight="bold" className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold">LONG</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-md w-fit border border-rose-500/10">
                             <TrendDown weight="bold" className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold">SHORT</span>
                          </div>
                        )}
                      </div>

                      {/* Qty */}
                      <span className="text-sm text-foreground/70 tabular-nums font-medium text-right">
                        {totalQty.toLocaleString()}
                      </span>

                      {/* Avg Entry */}
                      <span className="text-sm text-muted-foreground tabular-nums text-right">
                        {formatMoney(avgEntry)}
                      </span>

                      {/* Avg Exit */}
                      <span className="text-sm text-muted-foreground tabular-nums text-right">
                        {Number(c.avgExitPrice || 0) > 0
                          ? formatMoney(Number(c.avgExitPrice))
                          : <span className="text-muted-foreground/30">—</span>}
                      </span>

                      {/* Hold Time */}
                      <div className="flex justify-center">
                        {c.holdTime && c.holdTime !== "-" ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-secondary/50 text-foreground/70 border border-border/30 min-w-[50px]">
                            {c.holdTime}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </div>

                      {/* Return ($) */}
                      <span
                        className={`text-sm font-bold tabular-nums text-right ${
                          isWin ? "text-emerald-500" : isLoss ? "text-rose-500" : "text-muted-foreground"
                        }`}
                      >
                        {Number(c.pnl) > 0 ? "+" : ""}{formatMoney(Number(c.pnl || 0))}
                      </span>

                      {/* Return % */}
                      <div className="flex justify-end">
                        <span
                          className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md min-w-[64px] text-center border ${
                            isWin 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : isLoss 
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                              : "bg-secondary/50 text-muted-foreground border-border/50"
                          }`}
                        >
                          {returnPct > 0 ? "+" : ""}{returnPct.toFixed(2)}%
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {trades.map((trade) => {
          const c = computeTradeData(trade);
          const isWin = (c.pnl ?? 0) > 0;
          const isLoss = (c.pnl ?? 0) < 0;
          const entryDate: Date | null | undefined = (c as any).firstExecutionDate ?? (c as any).entryDate ?? null;
          const entryDateDisplay = entryDate ? format(entryDate, "MMM d") : "—";

          return (
            <div
              key={trade.id}
              onClick={() => onTradeClick(trade)}
              className="glass-card bg-card border border-border/50 px-4 py-3.5 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-foreground text-base">{trade.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 h-4 font-bold border-0 uppercase tracking-wide ${
                      ((c.status || "") as string).toString().toUpperCase() === "OPEN"
                        ? "bg-blue-500/10 text-blue-500"
                        : isWin
                        ? "bg-emerald-500/10 text-emerald-500"
                        : isLoss
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {((c.status || "") as string).toString().toUpperCase()}
                  </Badge>
                </div>
                {/* Converted Mobile PnL */}
                <span
                  className={`text-base font-bold tabular-nums ${isWin ? "text-emerald-500" : isLoss ? "text-rose-500" : "text-muted-foreground"}`}
                >
                  {Number(c.pnl) > 0 ? "+" : ""}{formatMoney(Number(c.pnl || 0))}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                 <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground/80">{entryDateDisplay}</span>
                    <span className="text-border/60">•</span>
                    <span className={((c.direction || "") as string).toString().toUpperCase() === "LONG" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                        {((c.direction || "") as string).toString().toUpperCase()}
                    </span>
                    <span className="text-border/60">•</span>
                    <span>{Number(c.totalQuantity || 0).toLocaleString()} Qty</span>
                 </div>
                 <div className={`font-bold tabular-nums ${isWin ? "text-emerald-500" : isLoss ? "text-rose-500" : ""}`}>
                    {Number(c.rMultiple || 0) > 0 ? "+" : ""}{Number(c.rMultiple || 0).toFixed(2)}R
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ Aesthetic Server-Side Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/30 px-2">
         
         {/* Page Size Select */}
         <div className="flex items-center gap-2 text-xs text-muted-foreground order-2 sm:order-1">
            <span>Rows per page</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs bg-background border-border/60">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((size) => (
                  <SelectItem key={size} value={size.toString()} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>

         {/* Navigation Controls */}
         <div className="order-1 sm:order-2 flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-medium">
               Page {pageIndex + 1} <span className="opacity-50 mx-1">/</span> {Math.ceil(Math.max(totalCount, 1) / pageSize)}
               <span className="ml-2 text-muted-foreground/60">({totalCount} total)</span>
            </span>
            
            <div className="flex items-center gap-1">
               <Button
                 variant="outline"
                 size="icon"
                 className="h-8 w-8 bg-background border-border/60 hover:bg-secondary/50"
                 onClick={prevPage}
                 disabled={!hasPrevPage}
               >
                 <CaretLeft className="w-4 h-4" />
               </Button>
               <Button
                 variant="outline"
                 size="icon"
                 className="h-8 w-8 bg-background border-border/60 hover:bg-secondary/50"
                 onClick={nextPage}
                 disabled={!hasNextPage}
               >
                 <CaretRight className="w-4 h-4" />
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TradesTable;