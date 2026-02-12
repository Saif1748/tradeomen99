import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ArrowDown,
  ArrowUp,
  Plus,
  CaretRight,
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
  Crown,
  Warning,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";

// hooks & context from working component
import { useUser } from "@/contexts/UserContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useInvitations } from "@/hooks/useInvitations";
import { useLedger } from "@/hooks/useLedger";

// types
import type { Invitation } from "@/types/account";

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
  // ---- user and data hooks (from working file) ----
  const { profile, user } = useUser();
  const userId = profile?.uid || user?.uid || "";
  const userEmail = profile?.email || user?.email || "";

  const {
    accounts = [],
    activeAccount,
    createAccount,
    switchAccount,
    renameAccount,
    deleteAccount,
    isRenaming,
    isDeleting,
  } = useAccounts(userId, userEmail);

  // selected account logic: allow sidebar selection while defaulting to activeAccount
  const [viewedAccountId, setViewedAccountId] = useState<string | null>(null);
  const selectedAccount = useMemo(() => {
    if (viewedAccountId) {
      const found = accounts.find((a) => a.id === viewedAccountId);
      if (found) return found;
    }
    return activeAccount || accounts[0] || null;
  }, [viewedAccountId, accounts, activeAccount]);

  // invitations & ledger, wired to selectedAccount.id
  const {
    incomingInvites = [],
    outgoingInvites = [],
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    isSending: isInviting,
    isProcessing: isProcessingInvite,
  } = useInvitations(userEmail, userId, selectedAccount?.id || "");

  const { transactions = [], isLoading: isLedgerLoading } = useLedger(
    selectedAccount?.id || "",
    userId
  );

  // ---- local UI state ----
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // sync edit name when selected changes
  useEffect(() => {
    if (selectedAccount) {
      setEditNameValue(selectedAccount.name || "");
    }
  }, [selectedAccount?.id]);

  // when modal opens, default to active account
  useEffect(() => {
    if (open && activeAccount && !viewedAccountId) {
      setViewedAccountId(activeAccount.id);
    }
  }, [open, activeAccount, viewedAccountId]);

  // ---- small helpers ----
  const formatBalance = (balance: number | undefined) => {
    const val = typeof balance === "number" ? balance : 0;
    const isNegative = val < 0;
    const formatted = Math.abs(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  };

  const formatDate = (d: any) => {
    if (!d) return "";
    const dt = d?.toDate ? d.toDate() : new Date(d);
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // members: support both array and object map (robust)
  const membersList = useMemo(() => {
    if (!selectedAccount) return [];
    if (Array.isArray(selectedAccount.members)) return selectedAccount.members;
    // object map -> values
    return Object.values(selectedAccount.members || {});
  }, [selectedAccount]);

  // permissions
  const isOwner = selectedAccount ? userId === selectedAccount.ownerId : false;
  const currentMember = userId && selectedAccount ? (selectedAccount.members?.[userId] ?? null) : null;
  const isEditor = currentMember?.role === "EDITOR";
  const canInvite = isOwner || isEditor;
  const canEdit = isOwner || isEditor;
  const canDelete = isOwner;

  // ---- actions ----
  const handleSwitchView = (accountId: string) => {
    setViewedAccountId(accountId);
    setIsEditingName(false);
    setShowDeleteConfirm(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !selectedAccount) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      await sendInvitation({ email: inviteEmail, role: "EDITOR" });
      setInviteEmail("");
      setShowInviteInput(false);
    } catch (e) {
      // hook handles errors
    }
  };

  const handleAcceptInvite = async (invitation: Invitation) => {
    try {
      await acceptInvitation(invitation);
      onOpenChange(false);
    } catch (e) {
      // hook handles errors
    }
  };

  const handleUpdateName = async () => {
    if (!selectedAccount || !editNameValue.trim()) return;
    try {
      await renameAccount({ accountId: selectedAccount.id, name: editNameValue });
      setIsEditingName(false);
    } catch (e) {
      // hook shows error
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id);
      const fallback = accounts.find((a) => a.id !== selectedAccount.id);
      if (fallback) {
        setViewedAccountId(fallback.id);
        setShowDeleteConfirm(false);
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      // hook handles
    }
  };

  if (!selectedAccount) {
    // safe fallback while data loads
    return null;
  }

  const TypeIcon = accountTypeIcons[selectedAccount.type || "personal"];
  const accountTypeLabel = accountTypeLabels[selectedAccount.type || "personal"] || "Account";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          hideClose
          className="max-w-4xl p-0 gap-0 bg-card/95 backdrop-blur-2xl border-border/40 overflow-hidden rounded-2xl"
        >
          <DialogTitle className="sr-only">Account Management</DialogTitle>
          <div className="flex h-[620px]">
            {/* Sidebar - Account List */}
            <div className="w-72 bg-secondary/10 flex flex-col">
              <div className="px-5 pt-5 pb-4">
                <h2 className="text-base font-semibold text-foreground tracking-tight">Accounts</h2>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Manage your trading accounts
                </p>
              </div>

              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1.5">
                  {accounts.map((account) => {
                    const Icon = accountTypeIcons[account.type || "personal"];
                    const isSelected = selectedAccount.id === account.id;
                    const isActive = activeAccount?.id === account.id;

                    return (
                      <motion.button
                        key={account.id}
                        onClick={() => handleSwitchView(account.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full p-3.5 rounded-xl text-left transition-all duration-200 group ${
                          isSelected
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-transparent border border-transparent hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "bg-secondary/60 text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <Icon weight="light" className="w-[18px] h-[18px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[13px] text-foreground truncate">
                                {account.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-px rounded text-[10px] font-medium bg-primary/15 text-primary">
                                  Active
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[13px] font-medium mt-0.5 ${
                                (account.balance ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {formatBalance(account.balance)}
                            </div>
                          </div>
                          {isSelected && (
                            <CaretRight
                              weight="bold"
                              className="w-3.5 h-3.5 text-primary/60 shrink-0"
                            />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Add Account Button */}
              <div className="p-4">
                <Button
                  variant="outline"
                  onClick={() => createAccount?.("New Account")}
                  className="w-full gap-2 h-10 rounded-xl bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-primary/20 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Plus weight="bold" className="w-4 h-4" />
                  <span className="text-[13px]">Add Account</span>
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-border/30" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-7 pt-6 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                    <TypeIcon weight="light" className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      {isEditingName ? (
                        <div className="flex items-center gap-2 w-full max-w-[420px]">
                          <Input
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="h-9 text-lg font-semibold bg-secondary/30 focus-visible:ring-primary/30"
                            autoFocus
                            aria-label="Edit account name"
                          />
                          <Button
                            size="icon"
                            className="h-9 w-9 shrink-0 bg-emerald-500 hover:bg-emerald-600"
                            onClick={handleUpdateName}
                            disabled={isRenaming}
                            aria-label="Save account name"
                          >
                            {isRenaming ? <SpinnerGap className="animate-spin" /> : <Check weight="bold" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0"
                            onClick={() => {
                              setIsEditingName(false);
                              setEditNameValue(selectedAccount.name || "");
                            }}
                            aria-label="Cancel editing name"
                          >
                            <X weight="bold" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-foreground tracking-tight truncate max-w-[420px]">
                            {selectedAccount.name}
                          </h3>
                          {canEdit && (
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Rename account"
                            >
                              <PencilSimple weight="light" className="w-4 h-4" />
                            </button>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary/60 text-muted-foreground">
                            {accountTypeLabel}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground/70 mt-0.5">
                      Created {formatDate(selectedAccount.createdAt)} · {membersList.length} member{membersList.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-7 pb-7 space-y-6">
                  {/* Balance Card */}
                  <div className="p-5 rounded-xl bg-secondary/20 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                          Account Balance
                        </p>
                        <p
                          className={`text-3xl font-semibold tracking-tight ${
                            (selectedAccount.balance ?? 0) >= 0 ? "text-foreground" : "text-red-400"
                          }`}
                        >
                          {formatBalance(selectedAccount.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {selectedAccount.currency || ""}
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <Button
                          onClick={() => setDepositOpen(true)}
                          className="gap-2 h-9 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-[13px]"
                        >
                          <ArrowDown weight="bold" className="w-3.5 h-3.5" />
                          Deposit
                        </Button>
                        <Button
                          onClick={() => setWithdrawOpen(true)}
                          variant="outline"
                          className="gap-2 h-9 px-4 rounded-xl bg-secondary/20 border-border/40 hover:bg-secondary/40 text-[13px]"
                        >
                          <ArrowUp weight="bold" className="w-3.5 h-3.5" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[13px] font-medium text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
                        <Users weight="light" className="w-4 h-4" />
                        Members
                      </h4>
                      {canInvite ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInviteInput((s) => !s)}
                          className="h-8 gap-1.5 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
                        >
                          <UserPlus weight="light" className="w-3.5 h-3.5" />
                          Invite
                        </Button>
                      ) : (
                        <div />
                      )}
                    </div>

                    {showInviteInput && (
                      <div className="mb-3 flex gap-2 p-1 bg-secondary/20 rounded-lg">
                        <Input
                          placeholder="Enter email address..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="bg-secondary/30 border-primary/30 focus-visible:ring-primary/30"
                          aria-label="Invite email"
                        />
                        <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                          {isInviting ? (
                            <>
                              <SpinnerGap className="w-4 h-4 animate-spin mr-2" /> Sending...
                            </>
                          ) : (
                            "Send"
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {membersList.map((member: any, idx) => (
                        <div
                          key={member.id ?? member.uid ?? idx}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/20 hover:bg-secondary/25 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/20 text-[11px] font-medium text-primary-foreground">
                              {(member.displayName || member.name || member.email || "U")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{member.displayName || member.name || (member.email?.split?.("@")?.[0])}</p>
                            <p className="text-xs text-muted-foreground/60 truncate">{member.email}</p>
                          </div>
                          <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-secondary/40 text-muted-foreground/80 capitalize">
                            {member.role ?? "member"}
                          </span>
                        </div>
                      ))}

                      {/* Outgoing invites */}
                      {outgoingInvites.map((invite: any) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 border-dashed"
                        >
                          <div className="h-9 w-9 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                            <EnvelopeSimple weight="fill" className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                            <p className="text-xs text-yellow-600/80 flex items-center gap-1">Invitation Pending</p>
                          </div>
                          {canInvite && (
                            <Button variant="ghost" size="sm" onClick={() => rejectInvitation(invite.id)} disabled={isProcessingInvite} className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0">
                              <Trash weight="bold" className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h4 className="text-[13px] font-medium text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Clock weight="light" className="w-4 h-4" />
                      Recent Transactions
                    </h4>

                    <div className="space-y-2">
                      {isLedgerLoading ? (
                        <div className="flex justify-center p-8"><SpinnerGap className="animate-spin text-primary" /></div>
                      ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/50 rounded-xl bg-secondary/10">
                          <p className="text-sm text-muted-foreground">No recent transactions found.</p>
                        </div>
                      ) : (
                        transactions.slice(0, 3).map((tx: any) => {
                          // tx may come as { id, type: "DEPOSIT"|"WITHDRAW", amount, date, status }
                          const txType = (tx.type || tx.transactionType || "").toString().toLowerCase();
                          const isDeposit = txType === "deposit" || txType === "DEPOSIT";
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/20 hover:bg-secondary/25 transition-colors"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                                }`}
                              >
                                {isDeposit ? (
                                  <ArrowDown weight="bold" className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUp weight="bold" className="w-3.5 h-3.5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-foreground capitalize truncate">
                                  {txType || tx.type}
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                  {formatDate(tx.date || tx.timestamp || tx.createdAt)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`text-[13px] font-medium ${
                                    isDeposit ? "text-emerald-400" : "text-orange-400"
                                  }`}
                                >
                                  {isDeposit ? "+" : "-"}${(tx.amount ?? 0).toLocaleString()}
                                </p>
                                <p
                                  className={`text-[11px] capitalize ${
                                    tx.status === "completed" ? "text-muted-foreground/60" :
                                    tx.status === "pending" ? "text-yellow-400" : "text-red-400"
                                  }`}
                                >
                                  {tx.status ?? ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  {canDelete && (
                    <div className="mt-8 pt-8 border-t border-red-500/20">
                      <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                        <Warning className="w-4 h-4" /> Danger Zone
                      </h4>
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Delete Workspace</p>
                          <p className="text-xs text-muted-foreground">Permanently delete this account and all data.</p>
                        </div>

                        {!showDeleteConfirm ? (
                          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
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

      <DepositModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        accountName={selectedAccount.name}
        accountId={selectedAccount.id}
      />
      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        accountName={selectedAccount.name}
        accountId={selectedAccount.id}
        currentBalance={selectedAccount.balance}
      />
    </>
  );
};
