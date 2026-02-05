import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, CurrencyDollar, Wallet } from "@phosphor-icons/react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { recordCashMovement } from "@/services/ledgerService";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

interface CashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CashModal = ({ open, onOpenChange }: CashModalProps) => {
  const { activeAccount } = useWorkspace();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");

  const handleSubmit = async () => {
    if (!activeAccount || !auth.currentUser) return;
    
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (activeTab === "WITHDRAWAL" && value > activeAccount.balance) {
      toast.error("Insufficient funds for withdrawal");
      return;
    }

    setLoading(true);
    try {
      await recordCashMovement(activeAccount.id, auth.currentUser.uid, {
        type: activeTab,
        amount: value,
        description: description || (activeTab === "DEPOSIT" ? "Manual Deposit" : "Manual Withdrawal")
      });
      
      toast.success(`Successfully ${activeTab === "DEPOSIT" ? "deposited" : "withdrew"} $${value}`);
      onOpenChange(false);
      setAmount("");
      setDescription("");
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] gap-0 p-0 overflow-hidden border-border bg-card">
        {/* Visual Header */}
        <div className={`h-24 w-full flex items-center justify-center ${activeTab === "DEPOSIT" ? "bg-emerald-500/10" : "bg-rose-500/10"} transition-colors duration-300`}>
          <div className={`p-3 rounded-full ${activeTab === "DEPOSIT" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
            {activeTab === "DEPOSIT" ? (
              <ArrowDown weight="bold" className="w-8 h-8" />
            ) : (
              <ArrowUp weight="bold" className="w-8 h-8" />
            )}
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              {activeTab === "DEPOSIT" ? "Fund Account" : "Withdraw Funds"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "DEPOSIT" 
                ? "Add capital to your trading account." 
                : "Remove profits or capital from your account."}
            </DialogDescription>
          </DialogHeader>

          <Tabs 
            defaultValue="DEPOSIT" 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="DEPOSIT" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="WITHDRAWAL" className="data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-500">
                Withdraw
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Amount ({activeAccount?.currency || "USD"})
              </Label>
              <div className="relative">
                <CurrencyDollar className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg font-medium bg-secondary/20 border-border focus-visible:ring-primary/30"
                />
              </div>
              {activeTab === "WITHDRAWAL" && (
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Available:</span>
                  <span className="font-mono text-foreground">${activeAccount?.balance.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Reference / Note (Optional)
              </Label>
              <Textarea
                placeholder={activeTab === "DEPOSIT" ? "e.g. Initial funding..." : "e.g. Monthly profit share..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none bg-secondary/20 border-border"
                rows={2}
              />
            </div>

            <Button 
              className={`w-full font-semibold mt-2 ${
                activeTab === "DEPOSIT" 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
              onClick={handleSubmit}
              disabled={loading || !amount || parseFloat(amount) <= 0}
            >
              {loading ? "Processing..." : (activeTab === "DEPOSIT" ? "Confirm Deposit" : "Confirm Withdrawal")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashModal;