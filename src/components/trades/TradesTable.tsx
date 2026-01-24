import { useState } from "react";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade, computeTradeData } from "@/lib/tradesData";
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

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = trades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 inline-flex flex-col opacity-30">
          <CaretUp weight="bold" className="w-2.5 h-2.5 -mb-0.5" />
          <CaretDown weight="bold" className="w-2.5 h-2.5 -mt-0.5" />
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <CaretUp weight="bold" className="w-3 h-3 ml-1 inline" />
    ) : (
      <CaretDown weight="bold" className="w-3 h-3 ml-1 inline" />
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

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="glass-card rounded-2xl overflow-hidden hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("date")}
              >
                Date
                <SortIcon field="date" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("symbol")}
              >
                Symbol
                <SortIcon field="symbol" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("type")}
              >
                Type
                <SortIcon field="type" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("side")}
              >
                Side
                <SortIcon field="side" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("pnl")}
              >
                P/L
                <SortIcon field="pnl" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("rMultiple")}
              >
                R-Multiple
                <SortIcon field="rMultiple" />
              </TableHead>
              <TableHead
                className="cursor-pointer text-muted-foreground font-normal"
                onClick={() => onSort("strategy")}
              >
                Strategy
                <SortIcon field="strategy" />
              </TableHead>
              <TableHead className="text-muted-foreground font-normal">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => {
              const computed = computeTradeData(trade);
              return (
                <TableRow
                  key={trade.id}
                  className="border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => onTradeClick(trade)}
                >
                  <TableCell className="text-muted-foreground">
                    {format(computed.firstExecutionDate, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {trade.symbol}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{trade.instrumentType}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${
                        computed.direction === "LONG"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {computed.direction}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-medium ${
                      computed.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {computed.pnl >= 0 ? "+" : ""}$
                    {Math.abs(computed.pnl).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    className={`${
                      computed.rMultiple >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {computed.rMultiple >= 0 ? "+" : ""}
                    {computed.rMultiple.toFixed(2)}R
                  </TableCell>
                  <TableCell className="text-foreground">{trade.strategy}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trade.tags.slice(0, 2).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {trade.tags.length > 2 && (
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary text-xs"
                        >
                          +{trade.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Card View - Optimized for scanability */}
      <div className="lg:hidden space-y-2">
        {paginatedTrades.map((trade) => {
          const computed = computeTradeData(trade);
          return (
            <div
              key={trade.id}
              onClick={() => onTradeClick(trade)}
              className="glass-card px-3 py-2.5 rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              {/* Row 1: Symbol + Date | P&L (dominant) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-foreground truncate">{trade.symbol}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      computed.direction === "LONG"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {computed.direction}
                  </Badge>
                </div>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    computed.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {computed.pnl >= 0 ? "+" : ""}${Math.abs(computed.pnl).toFixed(0)}
                </span>
              </div>
              {/* Row 2: Metadata - compact */}
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                <span>{format(computed.firstExecutionDate, "MMM d")}</span>
                <span>•</span>
                <span>{trade.strategy}</span>
                <span>•</span>
                <span className={computed.rMultiple >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                  {computed.rMultiple >= 0 ? "+" : ""}{computed.rMultiple.toFixed(1)}R
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, trades.length)} of {trades.length}
          </p>
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`h-8 ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                />
              </PaginationItem>
              <div className="hidden sm:flex gap-1">
                {getPageNumbers().map((page, index) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer h-8 w-8"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              </div>
              <span className="sm:hidden text-xs text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`h-8 ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
