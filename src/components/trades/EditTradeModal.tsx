import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, X, Image, Upload, Clipboard, Clock, SpinnerGap } from "@phosphor-icons/react";
import { Trade, AssetClass } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { getStrategies } from "@/services/strategyService";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

// Constants
const ASSET_CLASSES: AssetClass[] = ["STOCK", "CRYPTO", "FOREX", "FUTURES", "OPTIONS", "INDEX"];
const DEFAULT_TAGS = ["Impulse", "Breakout", "Reversal", "Trend Following", "Scalp", "News", "Earnings"];
const MAX_FILE_SIZE_MB = 10;

interface EditTradeModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTrade: (data: Partial<Trade>) => Promise<void>;
}

interface ScreenshotItem {
  id: string;
  dataUrl: string;
  name: string;
}

const EditTradeModal = ({
  trade,
  open,
  onOpenChange,
  onUpdateTrade,
}: EditTradeModalProps) => {
  const [activeTab, setActiveTab] = useState<"trade" | "journal" | "media">("trade");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Data Loading ---
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    const loadStrategies = async () => {
        if (trade?.accountId && open) {
            try {
                const data = await getStrategies(trade.accountId);
                setAvailableStrategies(data);
            } catch (err) {
                console.error("Failed to load strategies", err);
            }
        }
    };
    loadStrategies();
  }, [trade?.accountId, open]);

  // --- Form State ---
  const [instrumentType, setInstrumentType] = useState<AssetClass>("STOCK");
  const [symbol, setSymbol] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);

  useEffect(() => {
    if (trade) {
      setInstrumentType(trade.assetClass);
      setSymbol(trade.symbol);
      setStopLoss(trade.initialStopLoss?.toString() || "");
      setTarget(trade.takeProfitTarget?.toString() || "");
      setSelectedStrategyId(trade.strategyId || "");
      setSelectedTags(trade.tags || []);
      setNotes(trade.notes || "");
      
      // Convert screenshots
      setScreenshots((trade.screenshots || []).map((url, i) => ({
        id: uuidv4(),
        dataUrl: url,
        name: `screenshot-${i + 1}.png`
      })));
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

  // --- Screenshot Handling (Optimized) ---
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" is not an image.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large (Max ${MAX_FILE_SIZE_MB}MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setScreenshots((prev) => [
          ...prev,
          { id: uuidv4(), dataUrl, name: file.name }
        ]);
      };
      
      reader.onerror = () => {
          toast.error(`Failed to read file "${file.name}"`);
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(new DataTransfer().files);
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setScreenshots((prev) => [
              ...prev,
              { id: uuidv4(), dataUrl, name: "clipboard-image.png" }
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, [handleFileUpload]);

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!trade) return;

    setIsSubmitting(true);
    try {
        const updates: Partial<Trade> = {
            assetClass: instrumentType,
            symbol: symbol.toUpperCase(),
            initialStopLoss: parseFloat(stopLoss) || 0,
            takeProfitTarget: parseFloat(target) || 0,
            strategyId: selectedStrategyId || null,
            tags: selectedTags,
            notes,
            screenshots: screenshots.map(s => s.dataUrl)
        };

        await onUpdateTrade(updates);
        onOpenChange(false);
    } catch (error) {
        console.error(error);
        toast.error("Failed to update trade");
    } finally {
        setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "trade" as const, label: "Trade" },
    { id: "journal" as const, label: "Journal" },
    { id: "media" as const, label: "Media" },
  ];

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!isSubmitting) onOpenChange(val);
    }}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 bg-card border-border overflow-hidden max-h-[90vh] rounded-2xl"
        onPaste={handlePaste}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Trade</DialogTitle>
          <DialogDescription>Modify trade details</DialogDescription>
        </DialogHeader>

        {/* Header with pill tabs */}
        <div className="p-6 pb-0 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Edit Trade</h2>
            {isSubmitting && <SpinnerGap className="animate-spin text-muted-foreground" />}
          </div>
          
          <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.id === "media" && screenshots.length > 0 && (
                  <span className="ml-1.5 text-xs opacity-75">({screenshots.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "trade" && (
              <motion.div
                key="trade"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-6 pt-6 space-y-7"
              >
                <div className="grid grid-cols-2 gap-5">
                  {/* Symbol */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Symbol *</Label>
                    <Input
                      placeholder="AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="h-12 bg-muted/20 border-border/30 rounded-xl text-base font-medium uppercase"
                    />
                  </div>

                  {/* Asset Class */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Asset Class</Label>
                    <Select value={instrumentType} onValueChange={(v) => setInstrumentType(v as AssetClass)}>
                      <SelectTrigger className="h-12 bg-muted/20 border-border/30 rounded-xl text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50 rounded-xl">
                        {ASSET_CLASSES.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm rounded-lg">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Target</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="h-12 bg-muted/20 border-border/30 rounded-xl text-base"
                    />
                  </div>

                  {/* Stop Loss */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Stop Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="h-12 bg-muted/20 border-border/30 rounded-xl text-base"
                    />
                  </div>
                </div>
                
                {/* Note: Financials/Executions are intentionally hidden in Edit Mode to ensure integrity */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-500/80">
                    To modify price, quantity, or fees, please use the "Add Execution" feature or delete and re-enter the trade to maintain accurate PnL history.
                </div>
              </motion.div>
            )}

            {activeTab === "journal" && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 pt-6 space-y-7"
              >
                {/* Strategy */}
                <div className="space-y-2.5">
                  <Label className="text-sm text-muted-foreground font-normal">Strategy</Label>
                  <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                    <SelectTrigger className="h-12 bg-muted/20 border-border/30 rounded-xl text-base">
                      <SelectValue placeholder="Select a strategy..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50 rounded-xl">
                      {availableStrategies.length > 0 ? (
                          availableStrategies.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="rounded-lg">
                              {s.name}
                            </SelectItem>
                          ))
                      ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">No strategies found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <Label className="text-sm text-muted-foreground font-normal">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="h-11 bg-muted/20 border-border/30 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      className="h-11 px-4 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/30"
                    >
                      <Plus weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary pl-3 pr-1.5 py-1.5 rounded-lg text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1.5 hover:text-primary/70"
                          >
                            <X weight="bold" className="w-3.5 h-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick Tags */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Quick add</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => !selectedTags.includes(tag) && setSelectedTags([...selectedTags, tag])}
                          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-primary/20 text-primary"
                              : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2.5">
                  <Label className="text-sm text-muted-foreground font-normal">Notes</Label>
                  <Textarea
                    placeholder="Trade notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[140px] bg-muted/20 border-border/30 rounded-xl resize-none text-base"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 pt-6 space-y-6"
              >
                {/* Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload weight="regular" className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Drop images here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Paste hint */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clipboard weight="regular" className="w-4 h-4" />
                  <span>Or paste from clipboard (Cmd/Ctrl+V)</span>
                </div>

                {/* Uploaded Screenshots */}
                {screenshots.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Uploaded ({screenshots.length})</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {screenshots.map((screenshot) => (
                        <div key={screenshot.id} className="relative group aspect-video rounded-lg overflow-hidden bg-muted/20 border border-border/30">
                          <img src={screenshot.dataUrl} alt={screenshot.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeScreenshot(screenshot.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          >
                            <X weight="bold" className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/30 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
          >
            {isSubmitting ? <SpinnerGap className="animate-spin w-5 h-5" /> : "Update Trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;