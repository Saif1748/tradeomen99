import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Plus, 
  UploadSimple, 
  Spinner, 
  X, 
  CheckCircle, 
  Trash, 
  CalendarBlank, 
  Clock 
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { tradeTypes, defaultTags } from "@/lib/tradesData";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { tradesApi } from "@/services/api/modules/trades";
import { useStrategies } from "@/hooks/use-strategies";

// --- Helper Component: Date & Time Picker Popover ---
interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date; 
  disabled?: boolean;
}

const DateTimePicker = ({ date, setDate, minDate, maxDate, disabled }: DateTimePickerProps) => {
  const [timeValue, setTimeValue] = useState("12:00");

  // Sync internal time string when date prop changes
  useEffect(() => {
    if (date) {
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }
    // Preserve existing time from the time picker
    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-secondary/50 border-border/50",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarBlank className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM d, yyyy h:mm a") : <span>Pick date & time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-border/50">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(day) => {
                // Prevent future dates if maxDate set
                if (maxDate && day > maxDate) return true;
                // Prevent dates before minDate (e.g. Exit before Entry)
                if (minDate) {
                   const d = new Date(day); d.setHours(0,0,0,0);
                   const m = new Date(minDate); m.setHours(0,0,0,0);
                   return d < m;
                }
                return false;
              }}
              initialFocus
            />
          </div>
          <div className="p-4 flex flex-col gap-4 sm:w-[180px]">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Clock className="w-4 h-4" />
              <span>Time</span>
            </div>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="bg-secondary/50 border-border/50"
            />
            <div className="text-xs text-muted-foreground mt-auto">
              <p>Select date from calendar and adjust time above.</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};


interface AddTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional: We handle creation internally for rollback support
  onAddTrade?: (trade: any) => Promise<any>; 
}

const AddTradeModal = ({ open, onOpenChange }: AddTradeModalProps) => {
  const queryClient = useQueryClient();
  
  // --- Data Fetching ---
  const { strategies: availableStrategies, isLoading: loadingStrategies } = useStrategies();

  // --- State ---
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fields
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("CLOSED");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("STOCK");
  const [side, setSide] = useState("LONG");
  
  // Date State
  const [entryDate, setEntryDate] = useState<Date | undefined>(undefined);
  const [exitDate, setExitDate] = useState<Date | undefined>(undefined);

  // Numeric Fields
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  
  // Metadata
  // allow null for "No Strategy"
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NOTE: removed the auto-select effect that forced the first strategy ---
  // useEffect(() => {
  //   if (availableStrategies.length > 0 && !strategyId) {
  //     setStrategyId(availableStrategies[0].id);
  //   }
  // }, [availableStrategies, strategyId]);

  // --- Reset Form ---
  const resetForm = () => {
    setActiveTab("basic");
    setStatus("CLOSED");
    setSymbol("");
    setType("STOCK");
    setSide("LONG");
    setEntryDate(undefined);
    setEntryPrice("");
    setQuantity("");
    setExitDate(undefined);
    setExitPrice("");
    setFees("0");
    setStopLoss("");
    setTarget("");
    // don't auto-select a strategy on reset
    setStrategyId(null);
    setSelectedTags([]);
    setTagInput("");
    setNotes("");
    setSelectedFiles([]);
  };

  // --- Handlers ---

  const handleAddTag = () => {
    const val = tagInput.trim();
    if (val && !selectedTags.includes(val)) {
      setSelectedTags([...selectedTags, val]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = selectedFiles.length + newFiles.length;
      
      if (totalFiles > 5) {
        toast.error("You can only upload up to 5 screenshots.");
        return;
      }
      
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const calculateHoldTime = () => {
    if (!entryDate || !exitDate) return "0m";
    const diffMs = exitDate.getTime() - entryDate.getTime();
    if (diffMs < 0) return "0m";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;
  };

  // --- Validation ---
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    // Strict Date Check: Exit cannot be before Entry
    if (entryDate && exitDate && status === "CLOSED") {
      if (exitDate < entryDate) {
        errors.push("Exit date cannot be before entry date");
      }
    }

    // Stop Loss / Target Logic
    const sl = parseFloat(stopLoss) || 0;
    const tgt = parseFloat(target) || 0;
    const entry = parseFloat(entryPrice) || 0;

    if (sl > 0 && entry > 0) {
      if (side === "LONG" && sl >= entry) errors.push("Stop loss must be below entry for LONG");
      if (side === "SHORT" && sl <= entry) errors.push("Stop loss must be above entry for SHORT");
    }

    if (tgt > 0 && entry > 0) {
      if (side === "LONG" && tgt <= entry) errors.push("Target must be above entry for LONG");
      if (side === "SHORT" && tgt >= entry) errors.push("Target must be below entry for SHORT");
    }

    return errors;
  }, [entryDate, exitDate, entryPrice, stopLoss, target, side, status]);


  // --- Submit with Rollback Logic ---
  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    // Required Fields Check
    if (!symbol || !entryPrice || !quantity || !entryDate) {
        toast.error("Please fill in Symbol, Entry Date, Price, and Quantity.");
        return;
    }

    const numericEntryPrice = parseFloat(entryPrice);
    const numericQuantity = parseFloat(quantity);

    if (isNaN(numericEntryPrice) || numericEntryPrice <= 0) {
        toast.error("Please enter a valid Price greater than 0");
        return;
    }

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
        toast.error("Please enter a valid Quantity greater than 0");
        return;
    }

    setIsSubmitting(true);

    let createdTradeId: string | null = null;

    try {
        // 1. Prepare Payload (Strict Snake_Case & Uppercase for Backend)
        const payload = {
            symbol: symbol.toUpperCase(),
            instrument_type: type.toUpperCase(),
            direction: side.toUpperCase(),
            status: status.toUpperCase(),
            
            entry_time: entryDate.toISOString(),
            exit_time: status === "CLOSED" && exitDate ? exitDate.toISOString() : null,
            
            entry_price: numericEntryPrice,
            // Fallback: If CLOSED but no exit price provided, default to entry price
            exit_price: status === "CLOSED" ? (parseFloat(exitPrice) || numericEntryPrice) : null,
            
            quantity: numericQuantity,
            fees: parseFloat(fees) || 0,
            
            stop_loss: parseFloat(stopLoss) || null,
            target: parseFloat(target) || null,
            
            // send null when no strategy chosen
            strategy_id: strategyId || null,
            tags: selectedTags,
            notes: notes,
        };

        // 2. Create Trade via API Directly (Bypassing parent handler for control)
        const newTrade = await tradesApi.create(payload);
        createdTradeId = newTrade.id;

        // 3. Upload Screenshots (if any)
        if (selectedFiles.length > 0) {
            try {
                const uploadRes = await tradesApi.uploadScreenshots(selectedFiles, newTrade.id);
                
                // Extra safety: Check if backend confirmed linking
                if (!uploadRes.uploaded_to_trade) {
                    throw new Error("Screenshots uploaded but failed to link to trade.");
                }
                
                toast.success("Trade logged successfully with screenshots");
            } catch (uploadError) {
                console.error("Screenshot upload failed. Initiating Rollback.", uploadError);
                
                // --- ROLLBACK LOGIC ---
                // If upload/link fails, delete the trade we just created to prevent partial data.
                await tradesApi.delete(newTrade.id);
                
                toast.error("Failed to upload screenshots. Trade cancelled.");
                return; // Stop execution, keep modal open
            }
        } else {
            toast.success("Trade logged successfully");
        }

        // 4. Success Cleanup
        queryClient.invalidateQueries({ queryKey: ["trades"] }); // Refresh list
        resetForm();
        onOpenChange(false);

    } catch (error: any) {
        console.error("Submission error:", error);
        toast.error(error.detail || error.message || "Failed to log trade");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Log Trade</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quick entry — additional fields are optional.
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
            <TabsTrigger value="levels" className="flex-1">Levels</TabsTrigger>
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          </TabsList>

          {/* === BASIC TAB === */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            
            <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={status === "OPEN" ? "default" : "outline"}
                  className={status === "OPEN" ? "bg-secondary text-foreground border-border" : "bg-transparent border-border text-muted-foreground"}
                  onClick={() => setStatus("OPEN")}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant={status === "CLOSED" ? "default" : "outline"}
                  className={status === "CLOSED" ? "bg-primary text-primary-foreground" : "bg-transparent border-border text-muted-foreground"}
                  onClick={() => setStatus("CLOSED")}
                >
                  Closed
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Symbol</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    placeholder="AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="pl-7 bg-secondary/50 border-border/50 uppercase placeholder:normal-case"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(tradeTypes || ["STOCK", "CRYPTO", "FOREX"]).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
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
                    className={side === "LONG" ? "bg-primary text-primary-foreground" : "bg-transparent border-border text-muted-foreground"}
                    onClick={() => setSide("LONG")}
                  >
                    Long
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={side === "SHORT" ? "default" : "outline"}
                    className={side === "SHORT" ? "bg-secondary text-foreground border-border" : "bg-transparent border-border text-muted-foreground"}
                    onClick={() => setSide("SHORT")}
                  >
                    Short
                  </Button>
                </div>
              </div>
            </div>

            {/* Entry - Custom Picker */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Entry</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Date & Time</Label>
                  <DateTimePicker 
                    date={entryDate}
                    setDate={setEntryDate}
                    maxDate={new Date()}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </div>

            {/* Exit - Custom Picker */}
            {status === "CLOSED" && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Exit</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Date & Time</Label>
                    <DateTimePicker 
                      date={exitDate}
                      setDate={setExitDate}
                      minDate={entryDate} // Constraint: Exit >= Entry
                      maxDate={new Date()}
                      disabled={!entryDate}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Price (USD)</Label>
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
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Fees</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2 text-right">
                    Hold Time: <span className="text-foreground font-medium">{calculateHoldTime()}</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="levels" className="space-y-6 mt-6">
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

            <div>
              <Label className="text-sm font-medium mb-2 block">Strategy</Label>
              <Select
                // Map internal null -> "none" sentinel for the select control
                value={strategyId ?? "none"}
                onValueChange={(val) => setStrategyId(val === "none" ? null : val)}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select Strategy" />
                </SelectTrigger>
                <SelectContent>
                  {/* Explicit No Strategy option */}
                  <SelectItem value="none">No Strategy</SelectItem>

                  {loadingStrategies ? (
                    <div className="flex items-center justify-center p-2 text-muted-foreground">
                        <Spinner className="animate-spin w-4 h-4 mr-2" /> Loading...
                    </div>
                  ) : availableStrategies.length > 0 ? (
                    availableStrategies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                            <span>{s.emoji}</span> {s.name}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>No strategies found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
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
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-border/50 bg-secondary/50 cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/50"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} <X className="ml-1 w-3 h-3" />
                  </Badge>
                ))}
                {(defaultTags || []).filter(t => !selectedTags.includes(t)).slice(0, 3).map(tag => (
                   <Badge key={tag} variant="outline" className="opacity-50 cursor-pointer" onClick={() => setSelectedTags([...selectedTags, tag])}>+ {tag}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Notes</Label>
              <Textarea
                placeholder="Trade analysis, reasoning..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] bg-secondary/50 border-border/50"
              />
            </div>

            <div>
                <Label className="text-sm font-medium mb-2 block">Screenshots (Max 5)</Label>
                <div 
                    className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect}
                    />
                    
                    <div className="flex flex-col items-center gap-2">
                        <UploadSimple className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Click to upload images (Supported: PNG, JPG)
                        </p>
                    </div>
                </div>

                {/* ✅ Selected Files Preview Grid */}
                {selectedFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border/50 bg-black/40">
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                                >
                                    <Trash className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </TabsContent>
        </Tabs>

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
            disabled={isSubmitting || validationErrors.length > 0}
          >
            {isSubmitting ? <Spinner className="animate-spin w-4 h-4 mr-2" /> : null}
            Log Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeModal;
