import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, ArrowDown, ArrowUp, Plus, CaretRight, Clock, Buildings, User,
  GameController, EnvelopeSimple, Trash, Check, SpinnerGap, Crown,
  PencilSimple, Warning
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";

// Contexts
import { useSettings } from "@/contexts/SettingsContext";

// Industry-Grade Hooks
import { useAccounts } from "@/hooks/useAccounts";
import { useInvitations } from "@/hooks/useInvitations";
import { useLedger } from "@/hooks/useLedger";

// Types
import { Invitation } from "@/types/account";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const accountTypeIcons: Record<string, any> = {
  personal: User,
  business: Buildings,
  demo: GameController,
};

export const AccountModal = ({ open, onOpenChange }: AccountModalProps) => {
  const { profile } = useSettings();

  // --- 1. Accounts Hook (The Core Data Source) ---
  const { 
    accounts, 
    activeAccount, 
    createAccount, 
    switchAccount, 
    renameAccount, 
    deleteAccount,
    isRenaming,
    isDeleting 
  } = useAccounts(profile?.uid, profile?.email);

  // --- 2. View Selection Logic ---
  // We track local state for which account we are "inspecting" in the modal.
  const [viewedAccountId, setViewedAccountId] = useState<string | null>(null);

  // Derived: The 'Live' Account Object
  // Automatically updates if the cache updates (e.g. balance change via optimistic update)
  const selectedAccount = useMemo(() => {
    // 1. Try to find the specifically viewed account
    if (viewedAccountId) {
      const found = accounts.find(a => a.id === viewedAccountId);
      // If found, return it. If not (e.g., just deleted), fall through.
      if (found) return found; 
    }
    // 2. Fallback to the globally active account, or the first available one
    return activeAccount || accounts[0];
  }, [viewedAccountId, accounts, activeAccount]);

  // --- 3. Dependent Hooks (Ledger & Invitations) ---
  // These hooks automatically enable/disable based on whether we have a selectedAccount.
  // They also handle their own permissions via the 'enabled' flag inside the hook.
  
  const { 
    incomingInvites, 
    outgoingInvites, 
    sendInvitation, 
    acceptInvitation, 
    rejectInvitation,
    isSending: isInviting,
    isProcessing: isProcessingInvite
  } = useInvitations(profile?.email, profile?.uid, selectedAccount?.id);

  const { 
    transactions, 
    isLoading: isLedgerLoading 
  } = useLedger(selectedAccount?.id, profile?.uid);

  // --- 4. Local UI State ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  
  // Edit Name UI State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  
  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Modals
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // --- 5. Effects ---

  // Sync the edit input whenever the selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setEditNameValue(selectedAccount.name);
    }
  }, [selectedAccount?.id]);

  // When modal opens, default view to the active account if nothing selected
  useEffect(() => {
    if (open && activeAccount && !viewedAccountId) {
      setViewedAccountId(activeAccount.id);
    }
  }, [open, activeAccount]);

  // --- 6. Actions (Using Hooks) ---

  const handleUpdateName = async () => {
    if (!selectedAccount || !editNameValue.trim()) return;
    try {
      await renameAccount({ accountId: selectedAccount.id, name: editNameValue });
      setIsEditingName(false);
      // Toast handled by hook
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id);
      
      // Smart Fallback after deletion
      const fallback = accounts.find(a => a.id !== selectedAccount.id);
      if (fallback) {
        setViewedAccountId(fallback.id);
        setShowDeleteConfirm(false);
      } else {
        onOpenChange(false); // Close if no accounts left
      }
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleSwitchView = (account: any) => {
    setViewedAccountId(account.id);
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
    } catch (error) {
       // Error handled by hook
    }
  };

  const handleAcceptInvite = async (invitation: Invitation) => {
    try {
      await acceptInvitation(invitation);
      // Auto-switch to the new account is handled by the hook logic or we can force close
      onOpenChange(false); 
    } catch (e) {
      // Error handled by hook
    }
  };

  // --- Safe Returns ---
  if (!selectedAccount) return null;

  // --- Formatters ---
  const formatBalance = (val: number) => {
    return val.toLocaleString("en-US", { style: "currency", currency: selectedAccount.currency || "USD" });
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // --- Permissions ---
  const accountType = selectedAccount.type || "personal";
  const TypeIcon = accountTypeIcons[accountType] || User;
  const membersList = Object.values(selectedAccount.members || {});
  
  const isOwner = profile?.uid === selectedAccount.ownerId;
  const currentMember = profile ? selectedAccount.members[profile.uid] : null;
  const isEditor = currentMember?.role === "EDITOR";
  
  const canInvite = isOwner || isEditor;
  const canEdit = isOwner || isEditor;
  const canDelete = isOwner; 

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 bg-card/95 backdrop-blur-2xl border-border/50 overflow-hidden shadow-2xl">
          <DialogTitle className="sr-only">Account Management</DialogTitle>
          <div className="flex h-[600px]">
            
            {/* SIDEBAR */}
            <div className="w-72 border-r border-border/50 bg-secondary/20 flex flex-col">
              <div className="p-4 border-b border-border/50">
                <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage your workspaces</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {accounts.map((account) => {
                    const type = account.type || "personal";
                    const Icon = accountTypeIcons[type] || User;
                    const isSelected = selectedAccount.id === account.id;
                    const isActive = activeAccount?.id === account.id;

                    return (
                      <motion.button
                        key={account.id}
                        onClick={() => handleSwitchView(account)}
                        className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${
                          isSelected
                            ? "bg-primary/15 border border-primary/30"
                            : "bg-secondary/30 border border-transparent hover:bg-secondary/50 hover:border-border/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground"
                            }`}>
                            <Icon weight="light" className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground truncate block">
                                {account.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary uppercase tracking-wide">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-medium mt-0.5 ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {account.balance.toLocaleString("en-US", { style: "currency", currency: account.currency || "USD" })}
                            </div>
                          </div>
                          {isSelected && <CaretRight weight="bold" className="w-4 h-4 text-primary mt-1" />}
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Incoming Invites (From Hook) */}
                  {incomingInvites.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <div className="px-1 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Pending Invites</p>
                      </div>
                      
                      {incomingInvites.map((invite) => (
                        <div key={invite.id} className="p-3 mb-2 rounded-xl bg-background border border-border/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <EnvelopeSimple weight="fill" className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs text-muted-foreground">Invited to join</span>
                              <p className="text-sm font-medium truncate leading-tight">{invite.accountName}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAcceptInvite(invite)} disabled={isProcessingInvite} className="h-8 text-xs flex-1 bg-primary hover:bg-primary/90">
                              <Check weight="bold" className="w-3 h-3 mr-1.5" /> Accept
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectInvitation(invite.id)} disabled={isProcessingInvite} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                              <X weight="bold" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border/50">
                <Button variant="outline" onClick={() => createAccount("New Account")} className="w-full gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50">
                  <Plus weight="bold" className="w-4 h-4" /> <span className="text-sm">Create New Account</span>
                </Button>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center shrink-0">
                      <TypeIcon weight="light" className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 h-8">
                        {isEditingName ? (
                          <div className="flex items-center gap-2 w-full max-w-[300px]">
                            <Input 
                              value={editNameValue} 
                              onChange={(e) => setEditNameValue(e.target.value)} 
                              className="h-8 text-lg font-semibold bg-secondary/30 focus-visible:ring-primary/30"
                              autoFocus
                            />
                            <Button size="icon" className="h-8 w-8 shrink-0 bg-emerald-500 hover:bg-emerald-600" onClick={handleUpdateName} disabled={isRenaming}>
                              {isRenaming ? <SpinnerGap className="animate-spin" /> : <Check weight="bold" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setIsEditingName(false); setEditNameValue(selectedAccount.name); }}>
                              <X weight="bold" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-xl font-semibold text-foreground truncate max-w-[250px]">{selectedAccount.name}</h3>
                            {canEdit && (
                              <button onClick={() => setIsEditingName(true)} className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <PencilSimple weight="bold" className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {!isEditingName && activeAccount?.id !== selectedAccount.id && (
                          <Button size="sm" variant="ghost" onClick={() => switchAccount(selectedAccount.id)} className="h-6 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 ml-1 px-2">
                            Switch View
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {formatDate(selectedAccount.createdAt)} • {membersList.length} member{membersList.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => onOpenChange(false)} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                    <X weight="bold" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  
                  {/* Balance */}
                  <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-4xl font-bold tracking-tight ${selectedAccount.balance >= 0 ? "text-foreground" : "text-red-400"}`}>
                            {formatBalance(selectedAccount.balance)}
                          </p>
                          <span className="text-sm font-medium text-muted-foreground">{selectedAccount.currency}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setDepositOpen(true)} className="gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">
                          <ArrowDown weight="bold" className="w-4 h-4" /> Deposit
                        </Button>
                        <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50">
                          <ArrowUp weight="bold" className="w-4 h-4" /> Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Users weight="bold" className="w-4 h-4 text-primary" /> Team Members
                      </h4>
                      {canInvite && (
                        <Button variant="ghost" size="sm" onClick={() => setShowInviteInput(!showInviteInput)} className={`text-xs ${showInviteInput ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                          <Plus weight="bold" className="w-3 h-3 mr-1.5" /> {showInviteInput ? "Cancel" : "Invite Member"}
                        </Button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showInviteInput && (
                        <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
                          <div className="flex gap-2 p-1 bg-secondary/20 rounded-lg">
                            <Input placeholder="Enter email address..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-secondary/30 border-primary/30 focus-visible:ring-primary/30" autoFocus />
                            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                              {isInviting ? <><SpinnerGap className="w-4 h-4 animate-spin mr-2" /> Sending...</> : "Send Invite"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      {membersList.map((member) => (
                        <div key={member.uid} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-xs text-foreground font-medium">
                              {(member.email || "U").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{member.displayName || member.email.split('@')[0]}</p>
                              {member.role === 'OWNER' && <Crown weight="fill" className="w-4 h-4 text-amber-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                          <span className="px-2 py-1 rounded-md text-xs bg-secondary border border-border/50 text-muted-foreground capitalize">{member.role.toLowerCase()}</span>
                        </div>
                      ))}
                      
                      {/* Outgoing Invites (From Hook) */}
                      {outgoingInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 border-dashed">
                          <div className="h-9 w-9 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                            <Clock weight="fill" className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{invite.email}</p>
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

                  {/* Transactions (From Hook) */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
                      <Clock weight="bold" className="w-4 h-4 text-primary" /> Recent Transactions
                    </h4>
                    <div className="space-y-2">
                      {isLedgerLoading ? (
                        <div className="flex justify-center p-8"><SpinnerGap className="animate-spin text-primary" /></div>
                      ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/50 rounded-xl bg-secondary/10">
                          <p className="text-sm text-muted-foreground">No recent transactions found.</p>
                        </div>
                      ) : (
                        transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-border/30 hover:bg-secondary/20 transition-colors">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === "DEPOSIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"}`}>
                              {tx.type === "DEPOSIT" ? <ArrowDown weight="bold" /> : <ArrowUp weight="bold" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground capitalize">{tx.type.toLowerCase()}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold font-mono ${tx.type === "DEPOSIT" ? "text-emerald-400" : "text-orange-400"}`}>
                                {tx.type === "DEPOSIT" ? "+" : "-"}${tx.amount.toLocaleString()}
                              </p>
                              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Check weight="bold" className="w-3 h-3 text-primary" /> <span>Success</span></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Danger Zone (Delete) */}
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

      {/* Modals rely on IDs now, so they stay synced too */}
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} accountName={selectedAccount.name} accountId={selectedAccount.id} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} accountName={selectedAccount.name} accountId={selectedAccount.id} currentBalance={selectedAccount.balance} />
    </>
  );
};