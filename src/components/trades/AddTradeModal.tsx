import { useState } from "react";
import { X, Plus } from "@phosphor-icons/react";
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

interface AddTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTrade: (trade: Omit<Trade, "id">) => void;
}

const AddTradeModal = ({ open, onOpenChange, onAddTrade }: AddTradeModalProps) => {
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

  const resetForm = () => {
    setActiveTab("basic");
    setStatus("closed");
    setSymbol("");
    setType("Stock");
    setSide("LONG");
    setEntryDate("");
    setEntryPrice("");
    setQuantity("");
    setExitDate("");
    setExitPrice("");
    setFees("0");
    setStopLoss("");
    setTarget("");
    setStrategy(strategies[0]);
    setSelectedTags([]);
    setTagInput("");
    setNotes("");
  };

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
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;
  };

  const handleSubmit = () => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || entry;
    const sl = parseFloat(stopLoss) || 0;
    const tgt = parseFloat(target) || 0;
    const qty = parseFloat(quantity) || 0;
    const fee = parseFloat(fees) || 0;

    const pnl =
      side === "LONG" ? (exit - entry) * qty - fee : (entry - exit) * qty - fee;

    const risk = Math.abs(entry - sl) * qty;
    const rMultiple = risk > 0 ? pnl / risk : 0;

    const newTrade: Omit<Trade, "id"> = {
      date: entryDate ? new Date(entryDate) : new Date(),
      symbol: symbol.toUpperCase(),
      type,
      side,
      entryPrice: entry,
      exitPrice: exit,
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
      holdTime: calculateHoldTime(),
      risk,
    };

    onAddTrade(newTrade);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-medium">Log Trade</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Quick entry — additional fields are optional.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              <X weight="regular" className="w-5 h-5" />
            </Button>
          </div>
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

            {/* Exit */}
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

            {/* Hold Time */}
            <div className="text-sm text-muted-foreground">
              Hold Time: <span className="text-foreground">{calculateHoldTime()}</span>
            </div>
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
                Risk/Reward and R-Multiple will be calculated automatically based on your
                entry, exit, stop loss, and target levels.
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
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="bg-secondary/50 border-border/50"
                />
                <Button
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
                <Button variant="outline" className="border-border/50">
                  Browse Files
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="glow-button text-white">
            Log Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeModal;
