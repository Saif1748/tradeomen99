import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, CurrencyDollar, Note, Check, WarningCircle } from "@phosphor-icons/react";
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

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  currentBalance: number;
  // ✅ CHANGED: Logic is now delegated to parent for Optimistic Caching
  onSubmit: (amount: number, note: string) => Promise<void>; 
  isLoading: boolean; 
}

export const WithdrawModal = ({
  open,
  onOpenChange,
  accountName,
  currentBalance,
  onSubmit,
  isLoading,
}: WithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const willGoNegative = currentBalance - parsedAmount < 0;

  const handleWithdraw = async () => {
    // 1. Validation
    if (!amount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // 2. Delegate to Parent (uses useLedger hook for instant update)
    await onSubmit(parsedAmount, note);
    
    // 3. Reset form
    setAmount("");
    setNote("");
  };

  const formatBalance = (balance: number) => {
    const isNegative = balance < 0;
    const formatted = Math.abs(balance).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  };

  const quickPercentages = [25, 50, 75, 100];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
              <ArrowUp weight="bold" className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Withdraw Funds</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Withdraw from <strong>{accountName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Current Balance */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className={`text-2xl font-semibold ${currentBalance >= 0 ? "text-foreground" : "text-red-400"}`}>
                {formatBalance(currentBalance)}
              </p>
            </div>
            {parsedAmount > 0 && (
               <div className="text-right">
                 <p className="text-xs text-muted-foreground mb-1">New Balance</p>
                 <p className={`text-lg font-bold ${willGoNegative ? "text-red-500" : "text-foreground"}`}>
                   {formatBalance(currentBalance - parsedAmount)}
                 </p>
               </div>
            )}
          </div>

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
                className="pl-10 h-12 text-lg bg-secondary/50 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>

            {/* Quick percentages */}
            {currentBalance > 0 && (
              <div className="flex gap-2 mt-3">
                {quickPercentages.map((pct) => {
                  const calcAmount = Math.floor((currentBalance * pct) / 100);
                  return (
                    <motion.button
                      key={pct}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAmount(calcAmount.toString())}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-muted-foreground border border-border/50 hover:bg-secondary/80 hover:text-foreground transition-all"
                    >
                      {pct}%
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warning for negative balance */}
          {willGoNegative && parsedAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
            >
              <WarningCircle weight="fill" className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Balance Warning</p>
                <p className="text-xs text-yellow-400/80 mt-1">
                  This withdrawal will result in a negative balance of{" "}
                  <span className="font-semibold">{formatBalance(currentBalance - parsedAmount)}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Note weight="light" className="w-4 h-4" />
              Note (optional)
            </label>
            <Textarea
              placeholder="Add a note for this withdrawal..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary/50 border-border/50 resize-none h-20"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !amount}
            className="w-full h-12 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check weight="bold" className="w-5 h-5" />
                Confirm Withdrawal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};