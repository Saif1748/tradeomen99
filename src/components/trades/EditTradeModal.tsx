import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, X, Image, Upload, Clipboard, Clock } from "@phosphor-icons/react";
import { Trade, Execution, strategies, instrumentTypes, defaultTags, generateId } from "@/lib/tradesData";
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
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface EditTradeModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTrade: (trade: Trade) => void;
}

interface ExecutionInput {
  id: string;
  side: "BUY" | "SELL";
  price: string;
  quantity: string;
  datetime: string;
  fee: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Trade-level fields
  const [instrumentType, setInstrumentType] = useState<Trade["instrumentType"]>("Stock");
  const [symbol, setSymbol] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [strategy, setStrategy] = useState(strategies[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);

  // Executions
  const [executions, setExecutions] = useState<ExecutionInput[]>([]);

  // Create new execution with current datetime
  const createNewExecution = (): ExecutionInput => ({
    id: generateId(),
    side: "BUY",
    price: "",
    quantity: "",
    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    fee: "0"
  });

  useEffect(() => {
    if (trade) {
      setActiveTab("trade");
      setInstrumentType(trade.instrumentType);
      setSymbol(trade.symbol);
      setStopLoss(trade.stopLoss.toString());
      setTarget(trade.target.toString());
      setStrategy(trade.strategy);
      setSelectedTags(trade.tags);
      setNotes(trade.notes);
      
      // Convert screenshots to ScreenshotItem format
      setScreenshots(trade.screenshots.map((url, i) => ({
        id: generateId(),
        dataUrl: url,
        name: `screenshot-${i + 1}.png`
      })));
      
      // Convert executions to input format
      setExecutions(trade.executions.map(e => ({
        id: e.id,
        side: e.side,
        price: e.price.toString(),
        quantity: e.quantity.toString(),
        datetime: format(new Date(e.datetime), "yyyy-MM-dd'T'HH:mm"),
        fee: e.fee.toString(),
      })));
    }
  }, [trade]);

  const addExecution = () => {
    setExecutions([...executions, createNewExecution()]);
  };

  const removeExecution = (id: string) => {
    if (executions.length > 1) {
      setExecutions(executions.filter((e) => e.id !== id));
    }
  };

  const updateExecution = (id: string, field: keyof ExecutionInput, value: string) => {
    setExecutions(executions.map((e) => 
      e.id === id ? { ...e, [field]: value } : e
    ));
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

  // Screenshot handling
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setScreenshots((prev) => [
          ...prev,
          { id: generateId(), dataUrl, name: file.name }
        ]);
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
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setScreenshots((prev) => [
              ...prev,
              { id: generateId(), dataUrl, name: "clipboard-image.png" }
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const canSubmit = useMemo(() => {
    if (!symbol.trim()) return false;
    if (executions.length === 0) return false;
    return executions.some(e => e.price && e.quantity && e.datetime);
  }, [symbol, executions]);

  const handleSubmit = () => {
    if (!trade || !canSubmit) {
      toast.error("Please fill in symbol and at least one execution");
      return;
    }

    const validExecutions: Execution[] = executions
      .filter(e => e.price && e.quantity && e.datetime)
      .map(e => ({
        id: e.id,
        side: e.side,
        price: parseFloat(e.price) || 0,
        quantity: parseFloat(e.quantity) || 0,
        datetime: new Date(e.datetime),
        fee: parseFloat(e.fee) || 0,
      }));

    if (validExecutions.length === 0) {
      toast.error("Please add at least one valid execution");
      return;
    }

    const updatedTrade: Trade = {
      ...trade,
      symbol: symbol.toUpperCase(),
      instrumentType,
      stopLoss: parseFloat(stopLoss) || 0,
      target: parseFloat(target) || 0,
      strategy,
      tags: selectedTags,
      notes,
      screenshots: screenshots.map(s => s.dataUrl),
      executions: validExecutions,
      updatedAt: new Date(),
    };

    onUpdateTrade(updatedTrade);
    onOpenChange(false);
  };

  const tabs = [
    { id: "trade" as const, label: "Trade" },
    { id: "journal" as const, label: "Journal" },
    { id: "media" as const, label: "Media" },
  ];

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 bg-card border-border/50 overflow-hidden max-h-[90vh] rounded-2xl"
        onPaste={handlePaste}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Trade</DialogTitle>
        </DialogHeader>

        {/* Header with pill tabs */}
        <div className="p-6 pb-0 space-y-5">
          <h2 className="text-xl font-medium text-foreground">Edit Trade</h2>
          
          {/* Pill-style tabs */}
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

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
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
                {/* Trade Info - 2x2 grid for better spacing */}
                <div className="grid grid-cols-2 gap-5">
                  {/* Symbol */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Symbol *</Label>
                    <Input
                      placeholder="AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="h-12 bg-muted/20 border-border/30 rounded-xl text-base font-medium uppercase placeholder:font-normal placeholder:normal-case"
                    />
                  </div>

                  {/* Market/Instrument Type */}
                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Market</Label>
                    <Select value={instrumentType} onValueChange={(v) => setInstrumentType(v as Trade["instrumentType"])}>
                      <SelectTrigger className="h-12 bg-muted/20 border-border/30 rounded-xl text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50 rounded-xl">
                        {instrumentTypes.map((t) => (
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

                {/* Executions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Executions</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addExecution}
                      className="h-8 px-3 text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1.5"
                    >
                      <Plus weight="bold" className="w-4 h-4" />
                      Add
                    </Button>
                  </div>

                  {/* Execution Cards */}
                  <div className="space-y-3">
                    <AnimatePresence>
                      {executions.map((exec) => (
                        <motion.div
                          key={exec.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-muted/10 border border-border/20 rounded-xl p-4 space-y-3"
                        >
                          {/* Top Row: Side + DateTime */}
                          <div className="flex items-center gap-3">
                            {/* Side Toggle */}
                            <button
                              onClick={() => updateExecution(exec.id, "side", exec.side === "BUY" ? "SELL" : "BUY")}
                              className={`h-10 px-5 rounded-lg text-sm font-semibold transition-all ${
                                exec.side === "BUY"
                                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30"
                              }`}
                            >
                              {exec.side}
                            </button>

                            {/* DateTime */}
                            <div className="flex-1 relative">
                              <Clock weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="datetime-local"
                                value={exec.datetime}
                                onChange={(e) => updateExecution(exec.id, "datetime", e.target.value)}
                                className="h-10 bg-muted/20 border-border/30 rounded-lg text-sm pl-9"
                              />
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => removeExecution(exec.id)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                executions.length > 1 
                                  ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" 
                                  : "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                              }`}
                              disabled={executions.length <= 1}
                            >
                              <X weight="bold" className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Bottom Row: Qty, Price, Fee */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground">Quantity</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={exec.quantity}
                                onChange={(e) => updateExecution(exec.id, "quantity", e.target.value)}
                                className="h-10 bg-muted/20 border-border/30 rounded-lg text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground">Price</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={exec.price}
                                onChange={(e) => updateExecution(exec.id, "price", e.target.value)}
                                className="h-10 bg-muted/20 border-border/30 rounded-lg text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground">Fee</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={exec.fee}
                                onChange={(e) => updateExecution(exec.id, "fee", e.target.value)}
                                className="h-10 bg-muted/20 border-border/30 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
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
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="h-12 bg-muted/20 border-border/30 rounded-xl text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50 rounded-xl">
                      {strategies.map((s) => (
                        <SelectItem key={s} value={s} className="rounded-lg">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <Label className="text-sm text-muted-foreground font-normal">Tags</Label>
                  
                  {/* Tag Input */}
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
                  
                  {/* Selected Tags */}
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
                      {defaultTags.slice(0, 8).map((tag) => (
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
                    placeholder="What went well? What could improve? Market conditions..."
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
                      <p className="text-sm font-medium text-foreground">
                        Drop images here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
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
                    <h4 className="text-sm font-medium text-foreground">
                      Uploaded ({screenshots.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {screenshots.map((screenshot) => (
                        <div
                          key={screenshot.id}
                          className="relative group aspect-video rounded-lg overflow-hidden bg-muted/20 border border-border/30"
                        >
                          <img
                            src={screenshot.dataUrl}
                            alt={screenshot.name}
                            className="w-full h-full object-cover"
                          />
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

                {/* Empty state */}
                {screenshots.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                    <Image weight="regular" className="w-10 h-10 opacity-50" />
                    <p className="text-sm">No screenshots yet</p>
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
            className="h-11 px-6 rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
          >
            Update Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;
