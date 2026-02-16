// src/components/trades/AddTradeModal.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, X, Upload, Clipboard, SpinnerGap, Trash, TrendUp, TrendDown } from "@phosphor-icons/react";
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

// --- Services & Types ---
import { auth } from "@/lib/firebase";
import { uploadTradeImage } from "@/services/storageService";
import { AssetClass, TradeDirection } from "@/types/trade";
import { Strategy } from "@/types/strategy";
import { getStrategies } from "@/services/strategyService";

// --- Constants ---
const ASSET_CLASSES: AssetClass[] = ["STOCK", "CRYPTO", "FOREX", "FUTURES", "OPTIONS", "INDEX"];
const DEFAULT_TAGS = ["Impulse", "Breakout", "Reversal", "Trend Following", "Scalp", "News", "Earnings"];
const MAX_FILE_SIZE_MB = 10;

// --- Interfaces ---
interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ExecutionInput {
  id: string;
  side: "BUY" | "SELL";
  price: string;
  quantity: string;
  datetime: string;
  fee: string;
}

// Strictly typed payload to ensure industry-grade type safety
export interface TradeSubmissionPayload {
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  initialStopLoss: number;
  takeProfitTarget: number;
  strategyId: string | null;
  tags: string[];
  notes: string;
  screenshots: string[];
  executions: {
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
    date: Date;
    fees: number;
    notes: string;
  }[];
  entryDate: Date;
}

interface AddTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  onSubmit: (data: TradeSubmissionPayload) => Promise<void>;
}

// Helper for safe number parsing
const safeFloat = (val: string) => {
  const parsed = parseFloat(val);
  return isFinite(parsed) ? parsed : 0;
};

const AddTradeModal: React.FC<AddTradeModalProps> = ({ 
  open, 
  onOpenChange, 
  accountId, 
  onSubmit 
}) => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"trade" | "journal" | "media">("trade");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Data State ---
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  // --- Form State ---
  const [assetClass, setAssetClass] = useState<AssetClass>("STOCK");
  // REMOVED: const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [symbol, setSymbol] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Initialize executions
  const createNewExecution = useCallback((): ExecutionInput => ({
    id: uuidv4(),
    side: "BUY", // Defaults to BUY, user can toggle first row to set direction
    price: "",
    quantity: "",
    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    fee: ""
  }), []);

  const [executions, setExecutions] = useState<ExecutionInput[]>([]);

  // Initialize executions on mount
  useEffect(() => {
    if (executions.length === 0) setExecutions([createNewExecution()]);
  }, [createNewExecution]);

  // --- Derived Direction Logic ---
  // The first execution defines the trade direction
  const derivedDirection: TradeDirection = useMemo(() => {
    if (executions.length === 0) return "LONG";
    return executions[0].side === "BUY" ? "LONG" : "SHORT";
  }, [executions]);

  // --- Load Strategies ---
  useEffect(() => {
    if (accountId && open) {
      setLoadingStrategies(true);
      getStrategies(accountId)
        .then(setAvailableStrategies)
        .catch(err => console.error("Strategy fetch failed", err))
        .finally(() => setLoadingStrategies(false));
    }
  }, [accountId, open]);

  // --- Reset Form ---
  const resetForm = useCallback(() => {
    setActiveTab("trade");
    setAssetClass("STOCK");
    // setDirection("LONG"); // Removed
    setSymbol("");
    setStopLoss("");
    setTarget("");
    setSelectedStrategyId("");
    setSelectedTags([]);
    setTagInput("");
    setNotes("");
    setPendingImages([]);
    setExecutions([{
      id: uuidv4(),
      side: "BUY",
      price: "",
      quantity: "",
      datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      fee: ""
    }]);
    setIsSubmitting(false);
  }, []);

  // --- Handlers ---
  const addExecution = useCallback(() => {
    // Default new row side to match the FIRST execution (Entry side)
    const defaultSide = executions.length > 0 ? executions[0].side : "BUY";
    
    setExecutions(prev => [...prev, {
      id: uuidv4(),
      side: defaultSide,
      price: "",
      quantity: "",
      datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      fee: ""
    }]);
  }, [executions]);
  
  const removeExecution = useCallback((id: string) => {
    setExecutions(prev => prev.length > 1 ? prev.filter((e) => e.id !== id) : prev);
  }, []);

  const updateExecution = useCallback((id: string, field: keyof ExecutionInput, value: string) => {
    setExecutions(prev => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setTagInput("");
    }
  }, [tagInput, selectedTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter((t) => t !== tag));
  }, []);

  // --- Image Handling ---
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newImages: PendingImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }
      newImages.push({ 
        id: uuidv4(), 
        file, 
        previewUrl: URL.createObjectURL(file) 
      });
    });

    setPendingImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) added`);
      setActiveTab("media");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;
    const files: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
          foundImage = true;
        }
      }
    }

    if (foundImage) {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      handleFileUpload(dt.files);
    }
  }, [handleFileUpload]);

  useEffect(() => {
    return () => {
      pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [pendingImages]);

  // --- Validation ---
  const validateForm = (): string | null => {
    if (!symbol.trim()) return "Symbol is required.";
    const validExecs = executions.filter(e => e.price && e.quantity && e.datetime);
    if (validExecs.length === 0) return "At least one valid execution (Price, Qty, Date) is required.";
    return null;
  };

  const canSubmit = useMemo(() => {
    return !!symbol.trim() && executions.some(e => e.price && e.quantity && e.datetime);
  }, [symbol, executions]);

  // --- Submit ---
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error("Authentication session missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises = pendingImages.map(img => 
        uploadTradeImage(userId, img.file)
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);

      // Sort executions by date
      const formattedExecutions = executions
        .filter(e => e.price && e.quantity && e.datetime)
        .map(e => ({
          side: e.side,
          price: safeFloat(e.price),
          quantity: safeFloat(e.quantity),
          date: new Date(e.datetime),
          fees: safeFloat(e.fee),
          notes: ""
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (formattedExecutions.length === 0) throw new Error("No valid executions found.");

      const payload: TradeSubmissionPayload = {
        symbol: symbol.toUpperCase().trim(),
        assetClass,
        direction: derivedDirection, // 🟢 Uses derived direction
        initialStopLoss: safeFloat(stopLoss),
        takeProfitTarget: safeFloat(target),
        strategyId: selectedStrategyId || null,
        tags: selectedTags,
        notes: notes.trim(),
        screenshots: uploadedUrls,
        executions: formattedExecutions,
        entryDate: formattedExecutions[0].date
      };

      await onSubmit(payload);
      resetForm();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save trade. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 bg-card border-border overflow-hidden max-h-[90vh] rounded-2xl shadow-2xl"
        onPaste={handlePaste}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Log Trade</DialogTitle>
          <DialogDescription>Enter trade details, strategy, and upload screenshots.</DialogDescription>
        </DialogHeader>

        {/* --- Header --- */}
        <div className="p-6 pb-0 space-y-5 bg-card z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              Log Trade
              {isSubmitting && <SpinnerGap className="animate-spin text-muted-foreground w-4 h-4" />}
            </h2>
            {/* Display Inferred Direction */}
            <Badge variant="outline" className={`
                text-xs font-bold px-2 py-0.5 border-transparent
                ${derivedDirection === "LONG" 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-rose-500/10 text-rose-500"}
            `}>
                {derivedDirection === "LONG" ? <TrendUp className="w-3.5 h-3.5 mr-1" /> : <TrendDown className="w-3.5 h-3.5 mr-1" />}
                {derivedDirection}
            </Badge>
          </div>
          
          <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit border border-white/5">
            {[
              { id: "trade", label: "Trade" },
              { id: "journal", label: "Journal" },
              { id: "media", label: "Media" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tab.label}
                {tab.id === "media" && pendingImages.length > 0 && (
                  <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    {pendingImages.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* 1. TRADE TAB */}
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
                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Symbol</Label>
                    <Input
                      placeholder="e.g. AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="h-11 bg-secondary/20 border-border/40 font-semibold uppercase tracking-wide"
                      autoFocus
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset Class</Label>
                    <Select value={assetClass} onValueChange={(v) => setAssetClass(v as AssetClass)}>
                      <SelectTrigger className="h-11 bg-secondary/20 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_CLASSES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* REMOVED MANUAL DIRECTION SELECTOR */}

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Take Profit</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="h-11 pl-6 bg-secondary/20 border-border/40 tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stop Loss</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="h-11 pl-6 bg-secondary/20 border-border/40 tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Executions
                      <span className="bg-secondary/50 text-xs px-2 py-0.5 rounded-full text-muted-foreground">{executions.length}</span>
                    </h3>
                    <Button variant="ghost" size="sm" onClick={addExecution} className="h-8 text-primary hover:bg-primary/10">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {executions.map((exec, index) => (
                        <motion.div
                          key={exec.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-secondary/10 border border-border/30 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateExecution(exec.id, "side", exec.side === "BUY" ? "SELL" : "BUY")}
                              className={`h-9 px-3 rounded-lg text-xs font-bold border transition-colors ${
                                exec.side === "BUY"
                                  ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10"
                                  : "border-rose-500/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10"
                              }`}
                            >
                              {exec.side}
                            </button>
                            <Input
                              type="datetime-local"
                              value={exec.datetime}
                              onChange={(e) => updateExecution(exec.id, "datetime", e.target.value)}
                              className="h-9 text-xs bg-background/50 flex-1"
                            />
                            <button 
                              onClick={() => removeExecution(exec.id)}
                              disabled={executions.length === 1}
                              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-rose-500 disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              type="number" placeholder="Qty" value={exec.quantity}
                              onChange={(e) => updateExecution(exec.id, "quantity", e.target.value)}
                              className="h-9 text-xs bg-background/50 tabular-nums"
                            />
                            <Input
                              type="number" placeholder="Price" value={exec.price}
                              onChange={(e) => updateExecution(exec.id, "price", e.target.value)}
                              className="h-9 text-xs bg-background/50 tabular-nums"
                            />
                            <Input
                              type="number" placeholder="Fees" value={exec.fee}
                              onChange={(e) => updateExecution(exec.id, "fee", e.target.value)}
                              className="h-9 text-xs bg-background/50 tabular-nums"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. JOURNAL TAB */}
            {activeTab === "journal" && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 pt-6 space-y-7"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategy</Label>
                  <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                    <SelectTrigger className="h-11 bg-secondary/20 border-border/40">
                      <SelectValue placeholder="Select strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStrategies ? (
                        <div className="p-2 text-xs text-center text-muted-foreground">Loading...</div>
                      ) : availableStrategies.length > 0 ? (
                        availableStrategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                      ) : (
                        <div className="p-2 text-xs text-center text-muted-foreground">No strategies found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="h-10 bg-secondary/20 border-border/40"
                    />
                    <Button onClick={handleAddTag} variant="outline" className="h-10 w-10 p-0 border-border/40">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[30px]">
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="outline" className="h-7 pl-2.5 pr-1 gap-1 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-default">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:bg-primary/20 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedTags.length === 0 && <span className="text-xs text-muted-foreground italic">No tags selected</span>}
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Quick Select</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => !selectedTags.includes(tag) && setSelectedTags([...selectedTags, tag])}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                            selectedTags.includes(tag) 
                              ? "bg-primary/10 border-primary/20 text-primary opacity-50 cursor-not-allowed" 
                              : "bg-secondary/20 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</Label>
                  <Textarea
                    placeholder="Execution thoughts, mistakes, market context..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[160px] bg-secondary/20 border-border/40 resize-none text-sm leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

            {/* 3. MEDIA TAB */}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? "border-primary bg-primary/5 scale-[0.99]" 
                      : "border-border/40 hover:border-primary/40 hover:bg-secondary/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                      isDragging ? "bg-primary/20" : "bg-secondary/50"
                    }`}>
                      <Upload weight="fill" className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Click or drop images</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG (Max 10MB)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70">
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Pro tip: Paste screenshots directly (Cmd/Ctrl+V)</span>
                </div>

                {pendingImages.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Attached ({pendingImages.length})</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {pendingImages.map((img) => (
                        <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-border/30 group">
                          <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingImages(p => p.filter(i => i.id !== img.id)); }}
                              className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors transform hover:scale-110"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Footer --- */}
        <div className="p-6 pt-4 border-t border-border/30 flex justify-end gap-3 bg-card z-10">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl hover:bg-secondary/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="h-11 px-8 rounded-xl glow-button text-white font-medium min-w-[140px] shadow-lg shadow-primary/10"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <SpinnerGap className="animate-spin w-5 h-5" /> Saving...
              </span>
            ) : (
              "Save Trade"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeModal;