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

interface TradesTableProps {
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const TradesTable = ({
  trades,
  onTradeClick,
  sortField,
  sortDirection,
  onSort,
}: TradesTableProps) => {
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

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
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
          {trades.map((trade) => (
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
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {trade.side}
                </Badge>
              </TableCell>
              <TableCell
                className={`font-medium ${
                  trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
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
                  trade.rMultiple >= 0 ? "text-emerald-400" : "text-rose-400"
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
                      className="border-border/50 bg-secondary/50 text-muted-foreground text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {trade.tags.length > 2 && (
                    <Badge
                      variant="outline"
                      className="border-border/50 bg-secondary/50 text-muted-foreground text-xs"
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
  );
};

export default TradesTable;
