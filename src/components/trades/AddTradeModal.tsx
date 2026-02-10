import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, X, Image, Upload, Clipboard, SpinnerGap } from "@phosphor-icons/react";
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
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// --- Industry Grade Imports ---
import { auth } from "@/lib/firebase"; 
import { uploadTradeImage } from "@/services/storageService"; 
import { AssetClass, TradeDirection } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { getStrategies } from "@/services/strategyService";

// Constants
const ASSET_CLASSES: AssetClass[] = ["STOCK", "CRYPTO", "FOREX", "FUTURES", "OPTIONS", "INDEX"];
const DEFAULT_TAGS = ["Impulse", "Breakout", "Reversal", "Trend Following", "Scalp", "News", "Earnings"];
const MAX_FILE_SIZE_MB = 10;

// Local state for instant previews
interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface AddTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  onSubmit: (data: any) => Promise<void>;
}

interface ExecutionInput {
  id: string;
  side: "BUY" | "SELL";
  price: string;
  quantity: string;
  datetime: string;
  fee: string;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ 
  open, 
  onOpenChange, 
  accountId, 
  onSubmit 
}) => {
  const [activeTab, setActiveTab] = useState<"trade" | "journal" | "media">("trade");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Data Loading ---
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    const loadStrategies = async () => {
        if (accountId && open) {
            try {
                const data = await getStrategies(accountId);
                setAvailableStrategies(data);
            } catch (err) {
                console.error("Failed to load strategies", err);
            }
        }
    };
    loadStrategies();
  }, [accountId, open]);

  // --- Form State ---
  const [assetClass, setAssetClass] = useState<AssetClass>("STOCK");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [symbol, setSymbol] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  
  // ✅ Optimized Image State (No Base64 lag)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Executions
  const createNewExecution = (): ExecutionInput => ({
    id: uuidv4(),
    side: direction === "LONG" ? "BUY" : "SELL",
    price: "",
    quantity: "",
    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    fee: "0"
  });

  const [executions, setExecutions] = useState<ExecutionInput[]>([createNewExecution()]);

  // Sync side with direction
  useEffect(() => {
    if (executions.length === 1 && !executions[0].price && !executions[0].quantity) {
        setExecutions([{ ...executions[0], side: direction === "LONG" ? "BUY" : "SELL" }]);
    }
  }, [direction]);

  const resetForm = () => {
    setActiveTab("trade");
    setAssetClass("STOCK");
    setDirection("LONG");
    setSymbol("");
    setStopLoss("");
    setTarget("");
    setSelectedStrategyId("");
    setSelectedTags([]);
    setTagInput("");
    setNotes("");
    setPendingImages([]);
    setExecutions([createNewExecution()]);
    setIsSubmitting(false);
  };

  // Handlers
  const addExecution = () => setExecutions([...executions, createNewExecution()]);
  
  const removeExecution = (id: string) => {
    if (executions.length > 1) setExecutions(executions.filter((e) => e.id !== id));
  };

  const updateExecution = (id: string, field: keyof ExecutionInput, value: string) => {
    setExecutions(executions.map((e) => e.id === id ? { ...e, [field]: value } : e));
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

  // --- 🚀 Optimized Image Handling ---
  
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newImages: PendingImage[] = [];

    Array.from(files).forEach((file) => {
      // 1. Validation
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is too large (Max ${MAX_FILE_SIZE_MB}MB).`);
        return;
      }

      // 2. Instant Preview (0 Lag, no Base64 conversion)
      const previewUrl = URL.createObjectURL(file);
      newImages.push({ id: uuidv4(), file, previewUrl });
    });

    setPendingImages(prev => [...prev, ...newImages]);
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
          const dt = new DataTransfer();
          dt.items.add(file);
          handleFileUpload(dt.files);
        }
      }
    }
  }, [handleFileUpload]);

  const removeScreenshot = (id: string) => {
    setPendingImages(prev => {
        const item = prev.find(i => i.id === id);
        if (item) URL.revokeObjectURL(item.previewUrl); // Cleanup memory immediately
        return prev.filter((s) => s.id !== id);
    });
  };

  // Cleanup URLs on unmount to prevent memory leaks
  useEffect(() => {
      return () => {
          pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      };
  }, []);

  const canSubmit = useMemo(() => {
    if (!symbol.trim()) return false;
    if (executions.length === 0) return false;
    return executions.some(e => e.price && e.quantity && e.datetime);
  }, [symbol, executions]);

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Please fill in symbol and at least one execution");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
        toast.error("User not authenticated");
        return;
    }

    setIsSubmitting(true);

    try {
        // 1. 🚀 Upload Images Parallelly
        // Convert local Files -> Secure HTTPS URLs
        const uploadPromises = pendingImages.map(img => 
            uploadTradeImage(userId, img.file) // ✅ Fixed: Correct signature
        );
        
        const uploadedUrls = await Promise.all(uploadPromises);

        // 2. Prepare Executions
        const validExecutions = executions
        .filter(e => e.price && e.quantity && e.datetime)
        .map(e => ({
            side: e.side,
            price: parseFloat(e.price) || 0,
            quantity: parseFloat(e.quantity) || 0,
            date: new Date(e.datetime),
            fees: parseFloat(e.fee) || 0,
            notes: ""
        }));

        if (validExecutions.length === 0) throw new Error("Invalid execution data");

        // 3. Construct Payload with URLs
        const payload = {
            symbol: symbol.toUpperCase(),
            assetClass,
            direction,
            initialStopLoss: parseFloat(stopLoss) || 0,
            takeProfitTarget: parseFloat(target) || 0,
            strategyId: selectedStrategyId || null,
            tags: selectedTags,
            notes,
            screenshots: uploadedUrls, // ✅ Saving lightweight URLs
            executions: validExecutions,
            entryDate: validExecutions[0].date
        };

        await onSubmit(payload);
        resetForm();
    } catch (error) {
        console.error(error);
        toast.error("Failed to save trade");
    } finally {
        setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "trade" as const, label: "Trade" },
    { id: "journal" as const, label: "Journal" },
    { id: "media" as const, label: "Media" },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!isSubmitting) onOpenChange(val);
    }}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 bg-card border-border overflow-hidden max-h-[90vh] rounded-2xl"
        onPaste={handlePaste}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Log Trade</DialogTitle>
          <DialogDescription>Form to enter trade details</DialogDescription>
        </DialogHeader>

        {/* Header with pill tabs */}
        <div className="p-6 pb-0 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Log Trade</h2>
            {isSubmitting && <SpinnerGap className="animate-spin text-muted-foreground" />}
          </div>
          
          <div className="flex gap-1 p-1 bg-secondary/40 rounded-xl w-fit border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab.label}
                {tab.id === "media" && pendingImages.length > 0 && (
                  <span className="ml-1.5 text-xs opacity-75">({pendingImages.length})</span>
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
                {/* Trade Info - Grid */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1 space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Symbol *</Label>
                    <Input
                      placeholder="AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="h-12 bg-secondary/30 border-border/40 rounded-xl text-base font-medium uppercase placeholder:font-normal placeholder:normal-case"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Asset Class</Label>
                    <Select value={assetClass} onValueChange={(v) => setAssetClass(v as AssetClass)}>
                      <SelectTrigger className="h-12 bg-secondary/30 border-border/40 rounded-xl text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-xl">
                        {ASSET_CLASSES.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm rounded-lg cursor-pointer">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2.5">
                      <Label className="text-sm text-muted-foreground font-normal">Direction</Label>
                      <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl border border-white/5">
                        {["LONG", "SHORT"].map((dir) => (
                            <button
                                key={dir}
                                onClick={() => setDirection(dir as TradeDirection)}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    direction === dir 
                                    ? (dir === "LONG" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500") 
                                    : "text-muted-foreground hover:bg-white/5"
                                }`}
                            >
                                {dir}
                            </button>
                        ))}
                      </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Target</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="h-12 bg-secondary/30 border-border/40 rounded-xl text-base"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm text-muted-foreground font-normal">Stop Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="h-12 bg-secondary/30 border-border/40 rounded-xl text-base"
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

                  <div className="space-y-3">
                    <AnimatePresence>
                      {executions.map((exec) => (
                        <motion.div
                          key={exec.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-secondary/20 border border-border/30 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateExecution(exec.id, "side", exec.side === "BUY" ? "SELL" : "BUY")}
                              className={`h-10 px-4 min-w-[80px] rounded-lg text-sm font-bold transition-all ${
                                exec.side === "BUY"
                                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30"
                              }`}
                            >
                              {exec.side}
                            </button>

                            <div className="flex-1 relative">
                              <Input
                                type="datetime-local"
                                value={exec.datetime}
                                onChange={(e) => updateExecution(exec.id, "datetime", e.target.value)}
                                className="h-10 bg-background/50 border-border/30 rounded-lg text-sm pl-3"
                              />
                            </div>

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

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground ml-1">Quantity</span>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Qty"
                                value={exec.quantity}
                                onChange={(e) => updateExecution(exec.id, "quantity", e.target.value)}
                                className="h-10 bg-background/50 border-border/30 rounded-lg text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground ml-1">Price</span>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Price"
                                value={exec.price}
                                onChange={(e) => updateExecution(exec.id, "price", e.target.value)}
                                className="h-10 bg-background/50 border-border/30 rounded-lg text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground ml-1">Fee</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={exec.fee}
                                onChange={(e) => updateExecution(exec.id, "fee", e.target.value)}
                                className="h-10 bg-background/50 border-border/30 rounded-lg text-sm"
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
                <div className="space-y-2.5">
                  <Label className="text-sm text-muted-foreground font-normal">Strategy</Label>
                  <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                    <SelectTrigger className="h-12 bg-secondary/30 border-border/40 rounded-xl text-base">
                      <SelectValue placeholder="Select a strategy..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-xl">
                      {availableStrategies.length > 0 ? (
                          availableStrategies.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="cursor-pointer">{s.name}</SelectItem>
                          ))
                      ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">No strategies found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm text-muted-foreground font-normal">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="h-11 bg-secondary/30 border-border/40 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      className="h-11 px-4 rounded-xl border-border/40 bg-secondary/30 hover:bg-secondary/50"
                    >
                      <Plus weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-primary/30 bg-primary/10 text-primary pl-3 pr-1.5 py-1.5 rounded-lg text-sm">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 hover:text-primary/70">
                            <X weight="bold" className="w-3.5 h-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Quick add</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => !selectedTags.includes(tag) && setSelectedTags([...selectedTags, tag])}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                            selectedTags.includes(tag)
                              ? "bg-primary/20 text-primary border-primary/20"
                              : "bg-secondary/20 border-white/5 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm text-muted-foreground font-normal">Notes</Label>
                  <Textarea
                    placeholder="What went well? What could improve? Market conditions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[140px] bg-secondary/30 border-border/40 rounded-xl resize-none text-base"
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

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clipboard weight="regular" className="w-4 h-4" />
                  <span>Or paste from clipboard (Cmd/Ctrl+V)</span>
                </div>

                {pendingImages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      Uploaded ({pendingImages.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {pendingImages.map((img) => (
                        <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                          <img src={img.previewUrl} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeScreenshot(img.id)}
                            className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black/80"
                          >
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingImages.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                    <Image weight="regular" className="w-10 h-10 opacity-50" />
                    <p className="text-sm">No screenshots yet</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 pt-4 border-t border-border/30 flex justify-end gap-3 bg-card">
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
            disabled={!canSubmit || isSubmitting}
            className="h-11 px-8 rounded-xl glow-button text-primary-foreground font-medium disabled:opacity-50 min-w-[120px]"
          >
            {isSubmitting ? <SpinnerGap className="animate-spin w-5 h-5" /> : "Save Trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeModal;