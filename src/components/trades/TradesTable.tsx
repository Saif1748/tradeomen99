import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { format } from "date-fns";
import { UITrade } from "@/hooks/use-trades";
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
  trades: UITrade[];
  onTradeClick: (trade: UITrade) => void;
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
      <CaretUp weight="bold" className="w-3 h-3 ml-1 inline text-primary" />
    ) : (
      <CaretDown weight="bold" className="w-3 h-3 ml-1 inline text-primary" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="glass-card rounded-2xl overflow-hidden hidden lg:block border border-border/50">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="cursor-pointer text-muted-foreground font-medium transition-colors hover:text-foreground" onClick={() => onSort("date")}>
                Date <SortIcon field="date" />
              </TableHead>
              <TableHead className="cursor-pointer text-muted-foreground font-medium transition-colors hover:text-foreground" onClick={() => onSort("symbol")}>
                Symbol <SortIcon field="symbol" />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="cursor-pointer text-muted-foreground font-medium transition-colors hover:text-foreground" onClick={() => onSort("side")}>
                Side <SortIcon field="side" />
              </TableHead>
              <TableHead className="cursor-pointer text-muted-foreground font-medium transition-colors hover:text-foreground" onClick={() => onSort("pnl")}>
                P/L <SortIcon field="pnl" />
              </TableHead>
              <TableHead className="cursor-pointer text-muted-foreground font-medium transition-colors hover:text-foreground" onClick={() => onSort("rMultiple")}>
                R-Multiple <SortIcon field="rMultiple" />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Strategy</TableHead>
              <TableHead className="text-muted-foreground font-medium">Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                  No trades found.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const isLoss = (trade.pnl || 0) < 0;
                const isRLoss = trade.rMultiple < 0;

                return (
                  <TableRow
                    key={trade.id}
                    className="border-border/50 cursor-pointer hover:bg-primary/5 transition-colors group"
                    onClick={() => onTradeClick(trade)}
                  >
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {format(trade.date, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {trade.symbol}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{trade.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold h-5 px-2 ${
                          trade.side === "LONG"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                            : "border-rose-500/30 bg-rose-500/5 text-rose-500"
                        }`}
                      >
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-bold tabular-nums text-sm ${!isLoss ? "text-emerald-500" : "text-rose-500"}`}>
                      {!isLoss ? "+" : "-"}${Math.abs(trade.pnl || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className={`font-medium tabular-nums text-sm ${!isRLoss ? "text-emerald-500" : "text-rose-500"}`}>
                      {!isRLoss ? "+" : "-"}{Math.abs(trade.rMultiple).toFixed(2)}R
                    </TableCell>
                    <TableCell className="text-foreground/80 text-sm truncate max-w-[140px]">
                      {trade.strategy}
                    </TableCell>
                    
                    {/* ✅ Updated Tag Logic: Pill Stack Design */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {trade.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-primary text-[10px] h-5 px-2 whitespace-nowrap font-medium"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {trade.tags.length > 2 && (
                          <Badge
                            variant="outline"
                            // Matches the style of the tags exactly, but with slightly different opacity to indicate it's a counter
                            className="border-primary/20 bg-primary/10 text-primary text-[10px] h-5 px-1.5 font-bold"
                          >
                            +{trade.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Card View - Optimized for scanability */}
      <div className="lg:hidden space-y-3">
        {trades.map((trade) => {
          const isLoss = (trade.pnl || 0) < 0;
          return (
            <div
              key={trade.id}
              onClick={() => onTradeClick(trade)}
              className="glass-card px-4 py-3 rounded-xl border border-border/50 cursor-pointer active:scale-[0.98] transition-all hover:bg-secondary/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-foreground truncate">{trade.symbol}</span>
                  <Badge variant="outline" className={`text-[9px] h-4 px-1 ${
                      trade.side === "LONG" 
                        ? "border-emerald-500/30 text-emerald-500" 
                        : "border-rose-500/30 text-rose-500"
                    }`}>
                    {trade.side}
                  </Badge>
                </div>
                <span className={`text-lg font-bold tabular-nums ${!isLoss ? "text-emerald-500" : "text-rose-500"}`}>
                  {!isLoss ? "+" : "-"}${Math.abs(trade.pnl || 0).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <span>{format(trade.date, "MMM d")}</span>
                  <span>•</span>
                  <span className="truncate text-foreground/80">{trade.strategy}</span>
                  {/* Show first tag on mobile if available */}
                  {trade.tags.length > 0 && (
                     <span className="border border-primary/20 bg-primary/5 text-primary px-1 rounded-[4px] text-[9px] truncate max-w-[60px]">
                        {trade.tags[0]}
                     </span>
                  )}
                </div>
                <span className={`font-semibold shrink-0 ${trade.rMultiple >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {trade.rMultiple >= 0 ? "+" : "-"}{Math.abs(trade.rMultiple).toFixed(1)}R
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradesTable;