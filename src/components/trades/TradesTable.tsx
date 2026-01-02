import { useState } from "react";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Trade } from "@/lib/tradesData";
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
            {paginatedTrades.map((trade) => (
              <TableRow
                key={trade.id}
                className="border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => onTradeClick(trade)}
              >
                <TableCell className="text-muted-foreground">
                  {format(trade.date, "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {trade.symbol}
                </TableCell>
                <TableCell className="text-muted-foreground">{trade.type}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${
                      trade.side === "LONG"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {trade.side}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`font-medium ${
                    trade.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {trade.pnl >= 0 ? "+" : ""}$
                  {Math.abs(trade.pnl).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell
                  className={`${
                    trade.rMultiple >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {trade.rMultiple >= 0 ? "+" : ""}
                  {trade.rMultiple.toFixed(2)}R
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedTrades.map((trade) => (
          <div
            key={trade.id}
            onClick={() => onTradeClick(trade)}
            className="glass-card p-4 rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{trade.symbol}</p>
                <p className="text-xs text-muted-foreground">{format(trade.date, "MMM d, yyyy")}</p>
              </div>
              <span
                className={`text-lg font-semibold ${
                  trade.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs ${
                  trade.side === "LONG"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {trade.side}
              </Badge>
              <span className="text-xs text-muted-foreground">{trade.type}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{trade.strategy}</span>
              <span
                className={`text-xs ml-auto ${
                  trade.rMultiple >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, trades.length)} of {trades.length} trades
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
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
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
