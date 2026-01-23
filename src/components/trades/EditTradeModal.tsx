import { useState, useEffect, useMemo } from "react";
import { Plus } from "@phosphor-icons/react";
import { Trade, strategies, tradeTypes, defaultTags } from "@/lib/tradesData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";

interface EditTradeModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTrade: (trade: Trade) => void;
}

const EditTradeModal = ({
  trade,
  open,
  onOpenChange,
  onUpdateTrade,
}: EditTradeModalProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [status, setStatus] = useState<"open" | "closed">("closed");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<Trade["type"]>("Stock");
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [entryDate, setEntryDate] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [strategy, setStrategy] = useState(strategies[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (trade) {
      setStatus(trade.status);
      setSymbol(trade.symbol);
      setType(trade.type);
      setSide(trade.side);
      setEntryDate(format(trade.date, "yyyy-MM-dd'T'HH:mm"));
      setEntryPrice(trade.entryPrice.toString());
      setQuantity(trade.quantity.toString());
      setExitDate(format(trade.date, "yyyy-MM-dd'T'HH:mm"));
      setExitPrice(trade.exitPrice.toString());
      setFees(trade.fees.toString());
      setStopLoss(trade.stopLoss.toString());
      setTarget(trade.target.toString());
      setStrategy(trade.strategy);
      setSelectedTags(trade.tags);
      setNotes(trade.notes);
    }
  }, [trade]);

  const handleAddTag = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags([...selectedTags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const calculateHoldTime = () => {
    if (!entryDate || !exitDate) return "0m";
    const entry = new Date(entryDate);
    const exit = new Date(exitDate);
    const diffMs = exit.getTime() - entry.getTime();
    if (diffMs < 0) return "0m";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;
  };

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tgt = parseFloat(target) || 0;

    // Exit date validation
    if (entryDate && exitDate && status === "closed") {
      const entryDateTime = new Date(entryDate);
      const exitDateTime = new Date(exitDate);
      if (exitDateTime < entryDateTime) {
        errors.push("Exit date cannot be before entry date");
      }
    }

    // Stop loss validation
    if (sl > 0 && entry > 0) {
      if (side === "LONG" && sl >= entry) {
        errors.push("Stop loss must be below entry price for long positions");
      }
      if (side === "SHORT" && sl <= entry) {
        errors.push("Stop loss must be above entry price for short positions");
      }
    }

    // Target validation
    if (tgt > 0 && entry > 0) {
      if (side === "LONG" && tgt <= entry) {
        errors.push("Target must be above entry price for long positions");
      }
      if (side === "SHORT" && tgt >= entry) {
        errors.push("Target must be below entry price for short positions");
      }
    }

    return errors;
  }, [entryDate, exitDate, entryPrice, stopLoss, target, side, status]);

  const handleSubmit = () => {
    if (!trade) return;

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || entry;
    const sl = parseFloat(stopLoss) || 0;
    const tgt = parseFloat(target) || 0;
    const qty = parseFloat(quantity) || 0;
    const fee = parseFloat(fees) || 0;

    const pnl =
      status === "open"
        ? 0
        : side === "LONG"
        ? (exit - entry) * qty - fee
        : (entry - exit) * qty - fee;

    const risk = Math.abs(entry - sl) * qty;
    const rMultiple = risk > 0 ? pnl / risk : 0;

    const updatedTrade: Trade = {
      ...trade,
      date: entryDate ? new Date(entryDate) : trade.date,
      symbol: symbol.toUpperCase(),
      type,
      side,
      entryPrice: entry,
      exitPrice: status === "open" ? entry : exit,
      stopLoss: sl,
      target: tgt,
      quantity: qty,
      fees: fee,
      pnl,
      rMultiple,
      strategy,
      tags: selectedTags,
      notes,
      status,
      holdTime: status === "open" ? "-" : calculateHoldTime(),
      risk,
    };

    onUpdateTrade(updatedTrade);
    onOpenChange(false);
  };

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Edit Trade</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Modify trade details below.
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="basic" className="flex-1">
              Basic
            </TabsTrigger>
            <TabsTrigger value="levels" className="flex-1">
              Levels
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Trade Status */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Trade Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={status === "open" ? "default" : "outline"}
                  className={`${
                    status === "open"
                      ? "bg-secondary text-foreground border-border"
                      : "bg-transparent border-border text-muted-foreground"
                  }`}
                  onClick={() => setStatus("open")}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant={status === "closed" ? "default" : "outline"}
                  className={`${
                    status === "closed"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent border-border text-muted-foreground"
                  }`}
                  onClick={() => setStatus("closed")}
                >
                  Closed
                </Button>
              </div>
            </div>

            {/* Symbol, Type, Direction */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Symbol</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    placeholder="AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="pl-7 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as Trade["type"])}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradeTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Direction</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={side === "LONG" ? "default" : "outline"}
                    className={`${
                      side === "LONG"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent border-border text-muted-foreground"
                    }`}
                    onClick={() => setSide("LONG")}
                  >
                    Long
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={side === "SHORT" ? "default" : "outline"}
                    className={`${
                      side === "SHORT"
                        ? "bg-secondary text-foreground border-border"
                        : "bg-transparent border-border text-muted-foreground"
                    }`}
                    onClick={() => setSide("SHORT")}
                  >
                    Short
                  </Button>
                </div>
              </div>
            </div>

            {/* Entry */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Entry</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Avg Price (USD)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Qty / Lots
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </div>

            {/* Exit - Only show when status is closed */}
            {status === "closed" && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Exit</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      min={entryDate}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Exit Price (USD)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Fees (USD)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hold Time - Only show when status is closed */}
            {status === "closed" && (
              <div className="text-sm text-muted-foreground">
                Hold Time: <span className="text-foreground">{calculateHoldTime()}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="levels" className="space-y-6 mt-6">
            {/* Stop Loss & Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Stop Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="bg-secondary/50 border-border/50"
                />
                {stopLoss && entryPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {side === "LONG" ? "Must be below" : "Must be above"} entry price
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Target</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="bg-secondary/50 border-border/50"
                />
                {target && entryPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {side === "LONG" ? "Must be above" : "Must be below"} entry price
                  </p>
                )}
              </div>
            </div>

            {/* Strategy */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Risk/Reward and R-Multiple will be recalculated automatically based on your
                updated entry, exit, stop loss, and target levels.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Tags */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="bg-secondary/50 border-border/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  className="border-border/50"
                >
                  <Plus weight="regular" className="w-4 h-4" />
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border/50 bg-secondary/50 cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/50"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {defaultTags
                  .filter((t) => !selectedTags.includes(t))
                  .slice(0, 5)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border/30 bg-transparent text-muted-foreground cursor-pointer hover:bg-secondary/50"
                      onClick={() => setSelectedTags([...selectedTags, tag])}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Trade Notes */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Trade Notes</Label>
              <Textarea
                placeholder="Write your trade analysis, reasoning, lessons learned..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] bg-secondary/50 border-border/50"
              />
            </div>

            {/* Screenshots */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Screenshots</Label>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Drag & drop images here or click to upload
                </p>
                <Button type="button" variant="outline" className="border-border/50">
                  Browse Files
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm text-rose-400">
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="glow-button text-white"
            disabled={validationErrors.length > 0}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;
