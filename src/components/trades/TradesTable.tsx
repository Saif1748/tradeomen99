import { useState, useMemo, useEffect } from "react";
import { CaretUp, CaretDown, ChartLineUp } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade } from "@/types/trade";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TradesTableProps {
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const ITEMS_PER_PAGE = 30;

const TradesTable = ({
  trades,
  onTradeClick,
  sortField,
  sortDirection,
  onSort,
}: TradesTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if data length changes (filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [trades.length]);

  // Memoize pagination to prevent lag on re-renders
  const { paginatedTrades, totalPages } = useMemo(() => {
    const total = Math.ceil(trades.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = trades.slice(start, start + ITEMS_PER_PAGE);
    return { paginatedTrades: paginated, totalPages: total };
  }, [trades, currentPage]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 inline-flex flex-col opacity-20 hover:opacity-50 transition-opacity">
          <CaretUp weight="bold" className="w-2 h-2 -mb-0.5" />
          <CaretDown weight="bold" className="w-2 h-2 -mt-0.5" />
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <CaretUp weight="bold" className="w-3 h-3 ml-1 inline text-primary" />
    ) : (
      <CaretDown weight="bold" className="w-3 h-3 ml-1 inline text-primary" />
    );
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  // Helper to safely format dates
  const formatDate = (dateInput: any) => {
    if (!dateInput) return <span className="text-muted-foreground/30">-</span>;
    try {
      const date = typeof dateInput.toDate === 'function' 
        ? dateInput.toDate() 
        : new Date(dateInput);
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return <span className="text-rose-500 text-xs">Error</span>;
    }
  };

  // --- Render ---

  if (trades.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-dashed border-border/60">
        <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-3 text-muted-foreground">
          <ChartLineUp size={24} weight="duotone" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No trades found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Try adjusting your filters or add a new trade to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Desktop Table View */}
      <div className="glass-card rounded-2xl overflow-hidden hidden lg:block border border-border/40 shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="cursor-pointer h-11" onClick={() => onSort("entryDate")}>
                Date <SortIcon field="entryDate" />
              </TableHead>
              <TableHead className="cursor-pointer h-11" onClick={() => onSort("symbol")}>
                Symbol <SortIcon field="symbol" />
              </TableHead>
              <TableHead className="cursor-pointer h-11" onClick={() => onSort("assetClass")}>
                Type <SortIcon field="assetClass" />
              </TableHead>
              <TableHead className="cursor-pointer h-11" onClick={() => onSort("direction")}>
                Side <SortIcon field="direction" />
              </TableHead>
              <TableHead className="text-right cursor-pointer h-11" onClick={() => onSort("pnl")}>
                P/L <SortIcon field="pnl" />
              </TableHead>
              <TableHead className="text-right cursor-pointer h-11" onClick={() => onSort("riskMultiple")}>
                R-Multiple <SortIcon field="riskMultiple" />
              </TableHead>
              <TableHead className="h-11">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => {
              const pnl = trade.netPnl || 0;
              const rMultiple = trade.riskMultiple || 0;

              return (
                <TableRow
                  key={trade.id}
                  className="border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors group h-14"
                  onClick={() => onTradeClick(trade)}
                >
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {formatDate(trade.entryDate)}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {trade.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-normal opacity-70 bg-secondary/50">
                      {trade.assetClass}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wide border px-2 py-0.5 ${
                        trade.direction === "LONG"
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {trade.direction}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium font-mono tabular-nums ${
                      pnl > 0 ? "text-emerald-600 dark:text-emerald-400" 
                      : pnl < 0 ? "text-rose-600 dark:text-rose-400" 
                      : "text-muted-foreground"
                    }`}
                  >
                    {pnl > 0 ? "+" : ""}{pnl.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium text-sm tabular-nums ${
                      rMultiple > 0 ? "text-emerald-600 dark:text-emerald-400" 
                      : rMultiple < 0 ? "text-rose-600 dark:text-rose-400" 
                      : "text-muted-foreground/50"
                    }`}
                  >
                    {rMultiple !== 0 ? `${rMultiple > 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trade.tags?.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-border bg-background/50 text-[10px] text-muted-foreground group-hover:border-primary/20 transition-colors font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(trade.tags?.length || 0) > 2 && (
                        <span className="text-[10px] text-muted-foreground self-center ml-1">
                          +{trade.tags!.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedTrades.map((trade) => {
          const pnl = trade.netPnl || 0;
          const rMultiple = trade.riskMultiple || 0;

          return (
            <div
              key={trade.id}
              onClick={() => onTradeClick(trade)}
              className="glass-card p-4 rounded-xl cursor-pointer active:scale-[0.99] transition-transform border border-border/40"
            >
              {/* Row 1: Symbol + PnL */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-foreground">{trade.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-5 ${
                      trade.direction === "LONG"
                        ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                        : "border-rose-500/30 text-rose-600 bg-rose-500/5"
                    }`}
                  >
                    {trade.direction}
                  </Badge>
                </div>
                <span
                  className={`font-bold text-base tabular-nums ${
                    pnl > 0 ? "text-emerald-600 dark:text-emerald-400" 
                    : pnl < 0 ? "text-rose-600 dark:text-rose-400" 
                    : "text-muted-foreground"
                  }`}
                >
                  {pnl > 0 ? "+" : ""}{Math.abs(pnl).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </span>
              </div>

              {/* Row 2: Grid Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border-t border-border/30 pt-3">
                <div className="flex flex-col gap-0.5">
                   <span className="opacity-70">Date</span>
                   <span className="text-foreground font-medium">{formatDate(trade.entryDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-center border-l border-r border-border/30 px-2">
                   <span className="opacity-70">Type</span>
                   <span className="text-foreground font-medium">{trade.assetClass}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                   <span className="opacity-70">R-Multiple</span>
                   <span className={`font-medium ${
                      rMultiple > 0 ? "text-emerald-600 dark:text-emerald-400" 
                      : rMultiple < 0 ? "text-rose-600 dark:text-rose-400" 
                      : "text-foreground"
                   }`}>
                     {rMultiple !== 0 ? `${rMultiple > 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "-"}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, trades.length)}</span> of {trades.length} trades
          </p>
          
          <Pagination className="order-1 sm:order-2 w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`h-9 w-9 p-0 hover:bg-secondary ${currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
                />
              </PaginationItem>
              
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, i) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ell-${i}`}><PaginationEllipsis /></PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className={`h-9 w-9 cursor-pointer transition-all border-transparent ${
                            currentPage === page 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-bold" 
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              </div>
              
              <span className="sm:hidden text-sm font-medium px-4">
                Page {currentPage} of {totalPages}
              </span>

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`h-9 w-9 p-0 hover:bg-secondary ${currentPage === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TradesTable;