import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query"; // ✅ IMPORTED: Key for instant updates
import {
  Users,
  ArrowDown,
  ArrowUp,
  Plus,
  Clock,
  Buildings,
  User,
  GameController,
  PencilSimple,
  UserPlus,
  EnvelopeSimple,
  X,
  Trash,
  Check,
  SpinnerGap,
  Wallet,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Components
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";

// Hooks
import { useUser } from "@/contexts/UserContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useInvitations } from "@/hooks/useInvitations";
import { useLedger } from "@/hooks/useLedger";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypeIcons: Record<string, any> = {
  personal: User,
  business: Buildings,
  demo: GameController,
};

const accountTypeLabels: Record<string, string> = {
  personal: "Personal",
  business: "Business",
  demo: "Demo",
};

export const AccountModal = ({ open, onOpenChange }: AccountModalProps) => {
  const queryClient = useQueryClient(); // ✅ Init Query Client
  const { profile, user } = useUser();
  const userId = profile?.uid || user?.uid || "";
  const userEmail = profile?.email || user?.email || "";

  // --- 1. Data Fetching ---
  const {
    accounts = [],
    activeAccount,
    createAccount,
    renameAccount,
    deleteAccount,
    isRenaming,
    isDeleting,
  } = useAccounts(userId, userEmail);

  // --- 2. Selection Logic ---
  const [viewedAccountId, setViewedAccountId] = useState<string | null>(null);
  
  const selectedAccount = useMemo(() => {
    // Always try to find the updated account object from the fresh 'accounts' array
    if (viewedAccountId) {
      const found = accounts.find((a) => a.id === viewedAccountId);
      if (found) return found;
    }
    // Fallback to active or first available
    return activeAccount || accounts[0] || null;
  }, [viewedAccountId, accounts, activeAccount]);

  // Ensure view defaults to active account on open
  useEffect(() => {
    if (open && activeAccount && !viewedAccountId) {
      setViewedAccountId(activeAccount.id);
    }
  }, [open, activeAccount]);

  // --- 3. Sub-Hooks ---
  const {
    outgoingInvites = [],
    sendInvitation,
    rejectInvitation,
    isSending: isInviting,
  } = useInvitations(userEmail, userId, selectedAccount?.id || "");

  const { 
    transactions = [], 
    isLoading: isLedgerLoading,
    recordMovement, 
    isProcessing: isTransactionProcessing
  } = useLedger(selectedAccount?.id || "", userId);

  // --- 4. Local State ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Sync edit name input
  useEffect(() => {
    if (selectedAccount) setEditNameValue(selectedAccount.name || "");
  }, [selectedAccount?.id]);

  // --- 5. Handlers (with Cache Invalidation) ---

  const handleDeposit = async (amount: number, note: string) => {
    if (!selectedAccount) return;
    try {
      // 1. Perform Action
      await recordMovement({
        type: "DEPOSIT",
        amount,
        description: note || "Manual Deposit",
      });

      // 2. ⚡️ INSTANT UPDATE: Invalidate 'accounts' query to fetch new balance
      // This forces useAccounts to re-run and update the 'accounts' array above
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["ledger", selectedAccount.id] });

      setDepositOpen(false);
      // toast.success is handled by hook usually, but doubling up is safe or rely on hook
    } catch (error) {
      console.error("Deposit failed", error);
    }
  };

  const handleWithdraw = async (amount: number, note: string) => {
    if (!selectedAccount) return;
    try {
      await recordMovement({
        type: "WITHDRAWAL",
        amount,
        description: note || "Manual Withdrawal",
      });

      // ⚡️ INSTANT UPDATE
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["ledger", selectedAccount.id] });

      setWithdrawOpen(false);
    } catch (error) {
      console.error("Withdrawal failed", error);
    }
  };

  const handleSwitchView = (accountId: string) => {
    setViewedAccountId(accountId);
    setIsEditingName(false);
    setShowDeleteConfirm(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !selectedAccount) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error("Invalid email address");
      return;
    }
    try {
      await sendInvitation({ email: inviteEmail, role: "EDITOR" });
      setInviteEmail("");
      setShowInviteInput(false);
      // Invalidate invites if needed, usually handled by subscription or hook
      queryClient.invalidateQueries({ queryKey: ["invitations"] }); 
    } catch (e) { /* Hook handles error */ }
  };

  const handleUpdateName = async () => {
    if (!selectedAccount || !editNameValue.trim()) return;
    try {
      await renameAccount({ accountId: selectedAccount.id, name: editNameValue });
      setIsEditingName(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) { /* Hook handles error */ }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id);
      const fallback = accounts.find((a) => a.id !== selectedAccount.id);
      
      // Update local view state immediately
      if (fallback) {
        setViewedAccountId(fallback.id);
        setShowDeleteConfirm(false);
      } else {
        onOpenChange(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e) { /* Hook handles error */ }
  };

  // --- 6. Helpers ---
  const formatBalance = (balance: number | undefined) => {
    const val = typeof balance === "number" ? balance : 0;
    const isNegative = val < 0;
    const formatted = Math.abs(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: "currency",
      currency: selectedAccount?.currency || "USD"
    });
    return isNegative ? `-${formatted}` : formatted;
  };

  const formatDate = (d: any) => {
    if (!d) return "";
    const dt = d?.toDate ? d.toDate() : new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const membersList = useMemo(() => {
    if (!selectedAccount) return [];
    if (Array.isArray(selectedAccount.members)) return selectedAccount.members;
    return Object.values(selectedAccount.members || {});
  }, [selectedAccount]);

  const isOwner = selectedAccount ? userId === selectedAccount.ownerId : false;
  const currentMember = useMemo(() => {
    if (!selectedAccount || !userId) return null;
    return membersList.find((m: any) => (m.id === userId || m.uid === userId));
  }, [membersList, userId]);

  const isEditor = isOwner || currentMember?.role === "EDITOR";
  const canInvite = isOwner || isEditor;
  const canEdit = isOwner || isEditor;
  const canDelete = isOwner;

  if (!selectedAccount) return null;

  const TypeIcon = accountTypeIcons[selectedAccount.type || "personal"];
  const accountTypeLabel = accountTypeLabels[selectedAccount.type || "personal"] || "Account";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl p-0 gap-0 bg-card/95 backdrop-blur-2xl border-border/40 overflow-hidden rounded-2xl shadow-2xl [&>button]:hidden"
        >
          <DialogTitle className="sr-only">Account Management</DialogTitle>
          <DialogDescription className="sr-only">
            Manage your trading portfolios, settings, team members, and transactions.
          </DialogDescription>

          <div className="flex h-[620px]">
            
            {/* --- LEFT SIDEBAR: Account List --- */}
            <div className="w-72 bg-secondary/10 flex flex-col border-r border-border/40">
              <div className="px-5 pt-6 pb-4">
                <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                  <Wallet weight="duotone" className="w-5 h-5 text-primary" />
                  Accounts
                </h2>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Manage your trading portfolios
                </p>
              </div>

              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1.5">
                  {accounts.map((account) => {
                    const Icon = accountTypeIcons[account.type || "personal"];
                    const isSelected = selectedAccount.id === account.id;
                    const isActive = activeAccount?.id === account.id;

                    return (
                      <button
                        key={account.id}
                        onClick={() => handleSwitchView(account.id)}
                        className={`w-full p-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${
                          isSelected
                            ? "bg-background shadow-sm border border-border/60"
                            : "border border-transparent hover:bg-primary/5"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                        )}

                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary/40 text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <Icon weight={isSelected ? "duotone" : "light"} className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-[13px] truncate ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                {account.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-px rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className={`text-[12px] font-medium mt-0.5 truncate ${
                                (account.balance ?? 0) >= 0 ? "text-muted-foreground" : "text-red-400"
                              }`}>
                              {formatBalance(account.balance)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/30 bg-background/50">
                <Button
                  variant="outline"
                  onClick={() => createAccount?.("New Account")}
                  className="w-full gap-2 h-10 rounded-xl bg-background border-dashed border-border hover:border-primary/50 hover:text-primary transition-all shadow-none"
                >
                  <Plus weight="bold" className="w-4 h-4" />
                  <span className="text-[13px]">Add Portfolio</span>
                </Button>
              </div>
            </div>

            {/* --- RIGHT CONTENT: Details --- */}
            <div className="flex-1 flex flex-col bg-background/40">
              
              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-lg shadow-primary/5">
                    <TypeIcon weight="duotone" className="w-7 h-7 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isEditingName ? (
                          <div className="flex items-center gap-2 w-full max-w-[320px]">
                            <Input
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="h-9 text-lg font-semibold bg-background"
                              autoFocus
                            />
                            <Button size="icon" onClick={handleUpdateName} disabled={isRenaming} className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600">
                              {isRenaming ? <SpinnerGap className="animate-spin" /> : <Check weight="bold" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)} className="h-9 w-9">
                              <X weight="bold" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 group">
                            <h3 className="text-2xl font-bold text-foreground tracking-tight truncate">
                              {selectedAccount.name}
                            </h3>
                            {canEdit && (
                              <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground transition-all">
                                <PencilSimple weight="bold" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary text-muted-foreground border border-border/50 uppercase tracking-wide">
                        {accountTypeLabel}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-1 flex items-center gap-2">
                      <span>Created {formatDate(selectedAccount.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{membersList.length} member{membersList.length !== 1 ? "s" : ""}</span>
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-8 pb-8 space-y-8">
                  
                  {/* 💰 Balance Card (Instant Updates) */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary/40 to-background border border-border/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
                    
                    <div className="flex items-end justify-between relative z-10">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Total Balance</p>
                        {/* Key is crucial for re-rendering on optimistic update */}
                        <motion.div 
                          key={`${selectedAccount.id}-${selectedAccount.balance}`}
                          initial={{ opacity: 0.5, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`text-4xl font-bold tracking-tight ${
                            (selectedAccount.balance ?? 0) >= 0 ? "text-foreground" : "text-red-500"
                          }`}
                        >
                          {formatBalance(selectedAccount.balance)}
                        </motion.div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setDepositOpen(true)}
                          className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20"
                        >
                          <ArrowDown weight="bold" className="w-4 h-4 mr-2" />
                          Deposit
                        </Button>
                        <Button
                          onClick={() => setWithdrawOpen(true)}
                          variant="outline"
                          className="h-10 px-5 rounded-xl border-border bg-background hover:bg-secondary/50 font-medium"
                        >
                          <ArrowUp weight="bold" className="w-4 h-4 mr-2" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 👥 Members Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users weight="duotone" className="w-4 h-4 text-primary" />
                        Team Access
                      </h4>
                      {canInvite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowInviteInput((s) => !s)}
                          className="h-8 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5"
                        >
                          <UserPlus weight="bold" className="w-4 h-4 mr-1.5" />
                          Invite Member
                        </Button>
                      )}
                    </div>

                    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
                      {showInviteInput && (
                        <div className="p-3 border-b border-border/40 bg-secondary/20 flex gap-2">
                          <Input
                            placeholder="colleague@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="h-9 bg-background"
                          />
                          <Button size="sm" onClick={handleInvite} disabled={isInviting || !inviteEmail} className="h-9">
                            {isInviting ? <SpinnerGap className="animate-spin" /> : "Send"}
                          </Button>
                        </div>
                      )}

                      <div className="divide-y divide-border/30">
                        {/* Current Members */}
                        {membersList.map((member: any, idx) => (
                          <div key={member.id ?? idx} className="p-3 flex items-center gap-3 hover:bg-secondary/10 transition-colors">
                            <Avatar className="h-9 w-9 border border-border/50">
                              <AvatarFallback className="bg-secondary text-xs font-bold text-muted-foreground">
                                {(member.displayName || member.email || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{member.displayName || member.email}</p>
                              <p className="text-[11px] text-muted-foreground capitalize">{member.role}</p>
                            </div>
                            {member.id === userId && <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-medium">You</span>}
                          </div>
                        ))}

                        {/* Pending Invites */}
                        {outgoingInvites.map((invite: any) => (
                          <div key={invite.id} className="p-3 flex items-center gap-3 bg-yellow-500/5">
                            <div className="h-9 w-9 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                              <EnvelopeSimple weight="fill" className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate opacity-80">{invite.email}</p>
                              <p className="text-[11px] text-yellow-600 font-medium">Pending Acceptance</p>
                            </div>
                            {canInvite && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => rejectInvitation(invite.id)}>
                                <Trash weight="bold" className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 🕒 Transaction History */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Clock weight="duotone" className="w-4 h-4 text-primary" />
                      Recent Activity
                    </h4>

                    <div className="space-y-2">
                      {isLedgerLoading ? (
                        <div className="py-8 flex justify-center"><SpinnerGap className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                      ) : transactions.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-border/40 rounded-xl bg-secondary/5">
                          <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
                        </div>
                      ) : (
                        transactions.slice(0, 5).map((tx: any) => {
                          const isDeposit = tx.type === "DEPOSIT";
                          return (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-border transition-colors shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeposit ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"}`}>
                                  {isDeposit ? <ArrowDown weight="bold" className="w-4 h-4" /> : <ArrowUp weight="bold" className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{tx.description || (isDeposit ? "Deposit" : "Withdrawal")}</p>
                                  <p className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</p>
                                </div>
                              </div>
                              <span className={`text-sm font-semibold ${isDeposit ? "text-emerald-500" : "text-orange-500"}`}>
                                {isDeposit ? "+" : "-"}{Number(tx.amount).toLocaleString("en-US", { style: "currency", currency: selectedAccount.currency || "USD" })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ⚠️ Danger Zone */}
                  {canDelete && (
                    <div className="pt-6 border-t border-border/40">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div>
                          <p className="text-sm font-semibold text-red-600">Delete Portfolio</p>
                          <p className="text-xs text-red-600/70 mt-0.5">Permanently remove this account and all history.</p>
                        </div>
                        {!showDeleteConfirm ? (
                          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:text-red-700 hover:bg-red-500/10">
                            Delete
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} className="h-8">Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} className="h-8">
                              {isDeleting ? <SpinnerGap className="animate-spin" /> : "Confirm"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Optimized Modals (Passing Handlers) --- */}
      <DepositModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        accountName={selectedAccount.name}
        onSubmit={handleDeposit}
        isLoading={isTransactionProcessing}
      />
      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        accountName={selectedAccount.name}
        currentBalance={selectedAccount.balance ?? 0}
        onSubmit={handleWithdraw}
        isLoading={isTransactionProcessing}
      />
    </>
  );
};