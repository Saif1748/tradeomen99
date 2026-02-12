import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, CurrencyDollar, Note, Check } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  // ✅ Changed: Pass handler instead of IDs to allow parent to manage Optimistic UI
  onSubmit: (amount: number, note: string) => Promise<void>; 
  isLoading: boolean;
}

const quickAmounts = [1000, 5000, 10000, 25000];

export const DepositModal = ({
  open,
  onOpenChange,
  accountName,
  onSubmit,
  isLoading,
}: DepositModalProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    
    // 1. Validation
    if (!amount || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // 2. Delegate to Parent (AccountModal -> useLedger)
    await onSubmit(val, note);
    
    // 3. Reset form
    setAmount("");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
              <ArrowDown weight="bold" className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Deposit Funds</DialogTitle>
              {/* ✅ Fixed: Added Description for Accessibility Warning */}
              <DialogDescription className="text-sm text-muted-foreground">
                Add funds to your <strong>{accountName}</strong> portfolio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Amount
            </label>
            <div className="relative">
              <CurrencyDollar
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12 text-lg bg-secondary/50 border-border/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mt-3">
              {quickAmounts.map((quickAmount) => (
                <motion.button
                  key={quickAmount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    amount === quickAmount.toString()
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  ${quickAmount.toLocaleString()}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Note weight="light" className="w-4 h-4" />
              Note (optional)
            </label>
            <Textarea
              placeholder="e.g. Monthly top-up"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary/50 border-border/50 resize-none h-20"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount}
            className="w-full h-12 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check weight="bold" className="w-5 h-5" />
                Confirm Deposit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};