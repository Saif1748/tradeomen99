import {
  ArrowUp,
  ArrowDown,
  Warning,
  Target,
  ChartLineUp,
  CurrencyDollar,
  Clock,
  X,
  PencilSimple,
  Trash,
  Tag,
  Note,
  Image,
  ArrowRight,
  Spinner,
} from "@phosphor-icons/react";
import { format, formatDistance } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UITrade } from "@/hooks/use-trades";
import { tradesApi } from "@/services/api/modules/trades";

interface TradeDetailSheetProps {
  trade: UITrade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (trade: UITrade) => void;
  onDelete: (trade: UITrade) => void;
  allTrades?: UITrade[];
}

const TradeDetailSheet = ({
  trade,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allTrades = [],
}: TradeDetailSheetProps) => {
  // --- 1. Fetch Full Details (Notes & Signed Screenshots) ---
  // The list view trade object might contain raw/encrypted paths. 
  // We need to hit the backend to get signed URLs and full notes.
  const { data: fullDetails, isLoading } = useQuery({
    queryKey: ["trade", trade?.id],
    queryFn: async () => {
      if (!trade?.id) return null;
      // Fetch trade details which includes 'screenshots_signed' and decrypted 'notes'
      return await tradesApi.getOne(trade.id);
    },
    enabled: !!trade && open, // Only fetch when sheet is open
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  if (!trade) return null;

  // --- Dynamic Calculations ---
  const entryPrice = trade.entryPrice;
  const stopLoss = trade.stopLoss || 0;
  const target = trade.target || 0;
  const quantity = trade.quantity;

  const riskPerShare = stopLoss ? Math.abs(entryPrice - stopLoss) : 0;
  const rewardPerShare = target ? Math.abs(target - entryPrice) : 0;
  
  const rrRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare) : 0;
  const totalRisk = riskPerShare * quantity;

  const timeLabel = formatDistance(trade.date, new Date(), { addSuffix: true });

  const relatedTrades = allTrades
    .filter((t) => t.symbol === trade.symbol && t.id !== trade.id)
    .slice(0, 3);

  // --- Resolve Data for Display ---
  // Prefer fresh data from the single-fetch, fallback to the list prop
  const displayNotes = fullDetails?.notes || trade.notes || "";
  
  // The backend returns 'screenshots_signed' as an array of { path, url } objects
  // We cast to any here because the TS type definition might not include this dynamic field yet
  const signedScreenshots = (fullDetails as any)?.screenshots_signed || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[420px] p-0 border-l border-border bg-card"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Trade Details</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-medium text-foreground">{trade.symbol}</h2>
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
                </div>
                <p className="text-muted-foreground mt-1">
                  {format(trade.date, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={() => onEdit(trade)}
                >
                  <PencilSimple weight="regular" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-rose-400 h-8 w-8"
                  onClick={() => onDelete(trade)}
                >
                  <Trash weight="regular" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X weight="regular" className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* P&L Display */}
            <div className="text-right">
              <p
                className={`text-3xl font-medium tracking-tight ${
                  (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(trade.pnl || 0) >= 0 ? "+" : ""}$
                {Math.abs(trade.pnl || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Price Levels Card */}
            <div className="glass-card p-4 rounded-xl space-y-0">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <ArrowUp weight="regular" className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-muted-foreground">Entry</span>
                </div>
                <span className="font-medium text-foreground">
                  ${trade.entryPrice.toLocaleString()}
                </span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <ArrowDown weight="regular" className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-muted-foreground">Exit</span>
                </div>
                <span className="font-medium text-foreground">
                  {trade.exitPrice ? `$${trade.exitPrice.toLocaleString()}` : "-"}
                </span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Warning weight="regular" className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-muted-foreground">Stop Loss</span>
                </div>
                <span className="font-medium text-foreground">
                  {trade.stopLoss ? `$${trade.stopLoss.toLocaleString()}` : "-"}
                </span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Target</span>
                </div>
                <span className="font-medium text-foreground">
                  {trade.target ? `$${trade.target.toLocaleString()}` : "-"}
                </span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="glass-card p-4 rounded-xl space-y-0">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">R : R</span>
                </div>
                <span className="font-medium text-foreground">1 : {rrRatio.toFixed(1)}</span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Total Risk</span>
                </div>
                <span className="font-medium text-foreground">
                  ${totalRisk.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLineUp weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Quantity</span>
                </div>
                <span className="font-medium text-foreground">{trade.quantity}</span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Entry Time</span>
                </div>
                <span className="font-medium text-foreground">{timeLabel}</span>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Fees</span>
                </div>
                <span className="font-medium text-foreground">
                  ${trade.fees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Trade Notes (Uses fetched fresh data) */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Note weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Trade Notes</h4>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner className="animate-spin" /> Loading notes...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {displayNotes || "No notes added."}
                </p>
              )}
            </div>

            {/* Screenshots (Uses Signed URLs from Backend) */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Image weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Screenshots</h4>
              </div>
              
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <Spinner className="animate-spin" /> Loading screenshots...
                </div>
              ) : signedScreenshots.length > 0 ? (
                 <div className="grid grid-cols-2 gap-2">
                    {signedScreenshots.map((file: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block relative aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors group"
                        >
                            <img 
                              src={file.url} 
                              alt={`Screenshot ${idx + 1}`} 
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" 
                            />
                        </a>
                    ))}
                 </div>
              ) : (
                <p className="text-sm text-muted-foreground">No screenshots attached.</p>
              )}
            </div>

            {/* Strategy & Tags */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Tag weight="regular" className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Strategy & Tags</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-border/50 bg-secondary/50 text-foreground"
                >
                  {trade.strategy || "No Strategy"}
                </Badge>
                {trade.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Related Trades */}
            {relatedTrades.length > 0 && (
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Related Trades ({trade.symbol})
                  </h4>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-auto p-0">
                    View All <ArrowRight weight="regular" className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {relatedTrades.map((relatedTrade) => (
                    <div
                      key={relatedTrade.id}
                      className="flex items-center justify-between py-2 border-t border-border/30 first:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            relatedTrade.side === "LONG"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                              : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {relatedTrade.side}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(relatedTrade.date, "MMM d")}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          (relatedTrade.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {(relatedTrade.pnl || 0) >= 0 ? "+" : ""}$
                        {Math.abs(relatedTrade.pnl || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TradeDetailSheet;