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
import { auth } from "@/lib/firebase"; // ✅ Import Auth
import { recordCashMovement } from "@/services/ledgerService"; // ✅ Import Service

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  accountId: string; // ✅ Added ID to know where to deposit
}

const quickAmounts = [1000, 5000, 10000, 25000];

export const DepositModal = ({
  open,
  onOpenChange,
  accountName,
  accountId,
}: DepositModalProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    // 1. Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!auth.currentUser) {
      toast.error("You must be logged in");
      return;
    }

    setIsLoading(true);
    
    try {
      // 2. Real Backend Call
      await recordCashMovement(accountId, auth.currentUser.uid, {
        type: "DEPOSIT",
        amount: parseFloat(amount),
        description: note || "Manual Deposit",
      });

      // 3. Success UI
      toast.success(`$${parseFloat(amount).toLocaleString()} deposited successfully`);
      setAmount("");
      setNote("");
      onOpenChange(false);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to deposit funds. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              <DialogDescription className="text-sm">
                Add funds to {accountName}
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    amount === quickAmount.toString()
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-secondary/50 text-muted-foreground border border-border/50 hover:bg-secondary/80 hover:text-foreground"
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
              placeholder="Add a note for this deposit..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary/50 border-border/50 resize-none h-20"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleDeposit}
            disabled={isLoading || !amount}
            className="w-full h-12 gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
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