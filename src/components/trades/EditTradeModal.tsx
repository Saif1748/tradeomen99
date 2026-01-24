import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "@phosphor-icons/react";
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

const EditTradeModal = ({
  trade,
  open,
  onOpenChange,
  onUpdateTrade,
}: EditTradeModalProps) => {
  const [activeTab, setActiveTab] = useState<"general" | "journal">("general");
  
  // Trade-level fields
  const [instrumentType, setInstrumentType] = useState<Trade["instrumentType"]>("Stock");
  const [symbol, setSymbol] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [strategy, setStrategy] = useState(strategies[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");

  // Executions
  const [executions, setExecutions] = useState<ExecutionInput[]>([]);

  useEffect(() => {
    if (trade) {
      setActiveTab("general");
      setInstrumentType(trade.instrumentType);
      setSymbol(trade.symbol);
      setStopLoss(trade.stopLoss.toString());
      setTarget(trade.target.toString());
      setStrategy(trade.strategy);
      setSelectedTags(trade.tags);
      setNotes(trade.notes);
      
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
    setExecutions([
      ...executions,
      { id: generateId(), side: "BUY", price: "", quantity: "", datetime: "", fee: "0" }
    ]);
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
      executions: validExecutions,
      updatedAt: new Date(),
    };

    onUpdateTrade(updatedTrade);
    onOpenChange(false);
  };

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 bg-card border-border/50 overflow-hidden max-h-[90vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Trade</DialogTitle>
        </DialogHeader>

        {/* Custom Tab Header */}
        <div className="flex border-b border-border/30">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-4 text-sm font-medium transition-all relative ${
              activeTab === "general" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            General
            {activeTab === "general" && (
              <motion.div
                layoutId="editActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 py-4 text-sm font-medium transition-all relative ${
              activeTab === "journal" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            Journal
            {activeTab === "journal" && (
              <motion.div
                layoutId="editActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {activeTab === "general" ? (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-6 space-y-6"
              >
                {/* Trade Info Row */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Market/Instrument Type */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Market</Label>
                    <Select value={instrumentType} onValueChange={(v) => setInstrumentType(v as Trade["instrumentType"])}>
                      <SelectTrigger className="h-11 bg-secondary/30 border-border/30 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
                        {instrumentTypes.map((t) => (
                          <SelectItem key={t} value={t} className="text-sm">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Symbol */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Symbol</Label>
                    <Input
                      placeholder="AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="h-11 bg-secondary/30 border-border/30 rounded-xl text-sm uppercase"
                    />
                  </div>

                  {/* Target */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Target</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="h-11 bg-secondary/30 border-border/30 rounded-xl text-sm"
                    />
                  </div>

                  {/* Stop Loss */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Stop-Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="h-11 bg-secondary/30 border-border/30 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Executions Header */}
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-5 gap-3 text-xs text-muted-foreground font-normal flex-1 pr-10">
                    <span>Action</span>
                    <span>Date / Time</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Fee</span>
                  </div>
                </div>

                {/* Executions List */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {executions.map((exec) => (
                      <motion.div
                        key={exec.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        {/* Remove Button */}
                        <button
                          onClick={() => removeExecution(exec.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            executions.length > 1 
                              ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" 
                              : "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                          }`}
                          disabled={executions.length <= 1}
                        >
                          <X weight="bold" className="w-3 h-3" />
                        </button>

                        <div className="grid grid-cols-5 gap-2 flex-1">
                          {/* Side Toggle */}
                          <button
                            onClick={() => updateExecution(exec.id, "side", exec.side === "BUY" ? "SELL" : "BUY")}
                            className={`h-10 rounded-xl text-xs font-semibold transition-all ${
                              exec.side === "BUY"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {exec.side}
                          </button>

                          {/* DateTime */}
                          <Input
                            type="datetime-local"
                            value={exec.datetime}
                            onChange={(e) => updateExecution(exec.id, "datetime", e.target.value)}
                            className="h-10 bg-secondary/30 border-border/30 rounded-xl text-xs px-2"
                          />

                          {/* Quantity */}
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={exec.quantity}
                            onChange={(e) => updateExecution(exec.id, "quantity", e.target.value)}
                            className="h-10 bg-secondary/30 border-border/30 rounded-xl text-sm"
                          />

                          {/* Price */}
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={exec.price}
                            onChange={(e) => updateExecution(exec.id, "price", e.target.value)}
                            className="h-10 bg-secondary/30 border-border/30 rounded-xl text-sm"
                          />

                          {/* Fee */}
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={exec.fee}
                            onChange={(e) => updateExecution(exec.id, "fee", e.target.value)}
                            className="h-10 bg-secondary/30 border-border/30 rounded-xl text-sm"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add Execution Button */}
                <div className="flex justify-center">
                  <button
                    onClick={addExecution}
                    className="w-10 h-10 rounded-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center transition-colors"
                  >
                    <Plus weight="bold" className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="journal"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="p-6 space-y-6"
              >
                {/* Strategy */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-normal">Strategy</Label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="h-11 bg-secondary/30 border-border/30 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      {strategies.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground font-normal">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="h-10 bg-secondary/30 border-border/30 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddTag}
                      className="h-10 w-10 rounded-xl border-border/30 bg-secondary/30"
                    >
                      <Plus weight="regular" className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary pl-3 pr-1.5 py-1 rounded-lg"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1.5 hover:text-primary/70"
                          >
                            <X weight="bold" className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {defaultTags.slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => !selectedTags.includes(tag) && setSelectedTags([...selectedTags, tag])}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-normal">Notes</Label>
                  <Textarea
                    placeholder="Add notes about your trade reasoning, market conditions, lessons learned..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px] bg-secondary/30 border-border/30 rounded-xl resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-8 h-11 rounded-xl glow-button text-white font-medium"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;
