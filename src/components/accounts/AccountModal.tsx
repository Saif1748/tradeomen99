 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   X,
   Wallet,
   Users,
   ArrowDown,
   ArrowUp,
   Plus,
   Check,
   CaretRight,
   Clock,
   CurrencyDollar,
   Buildings,
   User,
   GameController,
 } from "@phosphor-icons/react";
 import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { demoAccounts, demoTransactions, Account } from "./types";
 import { DepositModal } from "./DepositModal";
 import { WithdrawModal } from "./WithdrawModal";
 
 interface AccountModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const accountTypeIcons = {
   personal: User,
   business: Buildings,
   demo: GameController,
 };
 
 const accountTypeLabels = {
   personal: "Personal",
   business: "Business",
   demo: "Demo",
 };
 
 export const AccountModal = ({ open, onOpenChange }: AccountModalProps) => {
   const [selectedAccount, setSelectedAccount] = useState<Account>(demoAccounts[0]);
   const [depositOpen, setDepositOpen] = useState(false);
   const [withdrawOpen, setWithdrawOpen] = useState(false);
 
   const formatBalance = (balance: number) => {
     const isNegative = balance < 0;
     const formatted = Math.abs(balance).toLocaleString("en-US", {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     });
     return isNegative ? `-$${formatted}` : `$${formatted}`;
   };
 
   const formatDate = (dateString: string) => {
     return new Date(dateString).toLocaleDateString("en-US", {
       month: "short",
       day: "numeric",
       year: "numeric",
     });
   };
 
   const TypeIcon = accountTypeIcons[selectedAccount.type];
 
   return (
     <>
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-4xl p-0 gap-0 bg-card/95 backdrop-blur-2xl border-border/50 overflow-hidden">
           <DialogTitle className="sr-only">Account Management</DialogTitle>
           <div className="flex h-[600px]">
             {/* Sidebar - Account List */}
             <div className="w-72 border-r border-border/50 bg-secondary/20 flex flex-col">
               <div className="p-4 border-b border-border/50">
                 <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
                 <p className="text-xs text-muted-foreground mt-1">
                   Manage your trading accounts
                 </p>
               </div>
 
               <ScrollArea className="flex-1">
                 <div className="p-3 space-y-2">
                   {demoAccounts.map((account) => {
                     const Icon = accountTypeIcons[account.type];
                     const isSelected = selectedAccount.id === account.id;
 
                     return (
                       <motion.button
                         key={account.id}
                         onClick={() => setSelectedAccount(account)}
                         whileHover={{ scale: 1.01 }}
                         whileTap={{ scale: 0.99 }}
                         className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${
                           isSelected
                             ? "bg-primary/15 border border-primary/30"
                             : "bg-secondary/30 border border-transparent hover:bg-secondary/50 hover:border-border/50"
                         }`}
                       >
                         <div className="flex items-start gap-3">
                           <div
                             className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                               isSelected
                                 ? "bg-primary/20 text-primary"
                                 : "bg-secondary text-muted-foreground group-hover:text-foreground"
                             }`}
                           >
                             <Icon weight="light" className="w-5 h-5" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className="font-medium text-sm text-foreground truncate">
                                 {account.name}
                               </span>
                               {account.isDefault && (
                                 <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary">
                                   Default
                                 </span>
                               )}
                             </div>
                             <div
                               className={`text-sm font-medium mt-0.5 ${
                                 account.balance >= 0
                                   ? "text-emerald-400"
                                   : "text-red-400"
                               }`}
                             >
                               {formatBalance(account.balance)}
                             </div>
                           </div>
                           {isSelected && (
                             <CaretRight
                               weight="bold"
                               className="w-4 h-4 text-primary mt-1"
                             />
                           )}
                         </div>
                       </motion.button>
                     );
                   })}
                 </div>
               </ScrollArea>
 
               {/* Add Account Button */}
               <div className="p-3 border-t border-border/50">
                 <Button
                   variant="outline"
                   className="w-full gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/30"
                 >
                   <Plus weight="bold" className="w-4 h-4" />
                   <span className="text-sm">Add Account</span>
                 </Button>
               </div>
             </div>
 
             {/* Main Content */}
             <div className="flex-1 flex flex-col">
               {/* Header */}
               <div className="p-6 border-b border-border/50">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center">
                       <TypeIcon weight="light" className="w-7 h-7 text-primary" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <h3 className="text-xl font-semibold text-foreground">
                           {selectedAccount.name}
                         </h3>
                         <span className="px-2 py-0.5 rounded-md text-xs bg-secondary border border-border/50 text-muted-foreground">
                           {accountTypeLabels[selectedAccount.type]}
                         </span>
                       </div>
                       <p className="text-sm text-muted-foreground mt-1">
                         Created {formatDate(selectedAccount.createdAt)} •{" "}
                         {selectedAccount.members.length} member
                         {selectedAccount.members.length > 1 ? "s" : ""}
                       </p>
                     </div>
                   </div>
 
                   <button
                     onClick={() => onOpenChange(false)}
                     className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                   >
                     <X weight="bold" className="w-5 h-5" />
                   </button>
                 </div>
               </div>
 
               {/* Balance Card */}
               <div className="p-6">
                 <div className="glass-card p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm text-muted-foreground mb-1">
                         Account Balance
                       </p>
                       <p
                         className={`text-3xl font-semibold ${
                           selectedAccount.balance >= 0
                             ? "text-foreground"
                             : "text-red-400"
                         }`}
                       >
                         {formatBalance(selectedAccount.balance)}
                       </p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {selectedAccount.currency}
                       </p>
                     </div>
 
                     <div className="flex gap-2">
                       <Button
                         onClick={() => setDepositOpen(true)}
                         className="gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                       >
                         <ArrowDown weight="bold" className="w-4 h-4" />
                         Deposit
                       </Button>
                       <Button
                         onClick={() => setWithdrawOpen(true)}
                         variant="outline"
                         className="gap-2 bg-secondary/30 border-border/50 hover:bg-secondary/50"
                       >
                         <ArrowUp weight="bold" className="w-4 h-4" />
                         Withdraw
                       </Button>
                     </div>
                   </div>
                 </div>
 
                 {/* Members Section */}
                 <div className="mt-6">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                       <Users weight="light" className="w-4 h-4" />
                       Members
                     </h4>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="text-xs text-primary hover:text-primary/80"
                     >
                       <Plus weight="bold" className="w-3 h-3 mr-1" />
                       Invite
                     </Button>
                   </div>
 
                   <div className="space-y-2">
                     {selectedAccount.members.map((member) => (
                       <div
                         key={member.id}
                         className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
                       >
                         <Avatar className="h-9 w-9">
                           <AvatarFallback className="bg-gradient-to-br from-primary/50 to-glow-secondary/50 text-xs text-white">
                             {member.name
                               .split(" ")
                               .map((n) => n[0])
                               .join("")}
                           </AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                           <p className="text-sm font-medium text-foreground">
                             {member.name}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {member.email}
                           </p>
                         </div>
                         <span className="px-2 py-1 rounded-md text-xs bg-secondary border border-border/50 text-muted-foreground capitalize">
                           {member.role}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
 
                 {/* Recent Transactions */}
                 <div className="mt-6">
                   <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                     <Clock weight="light" className="w-4 h-4" />
                     Recent Transactions
                   </h4>
 
                   <div className="space-y-2">
                     {demoTransactions.slice(0, 3).map((tx) => (
                       <div
                         key={tx.id}
                         className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
                       >
                         <div
                           className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                             tx.type === "deposit"
                               ? "bg-emerald-500/10 text-emerald-400"
                               : "bg-orange-500/10 text-orange-400"
                           }`}
                         >
                           {tx.type === "deposit" ? (
                             <ArrowDown weight="bold" className="w-4 h-4" />
                           ) : (
                             <ArrowUp weight="bold" className="w-4 h-4" />
                           )}
                         </div>
                         <div className="flex-1">
                           <p className="text-sm font-medium text-foreground capitalize">
                             {tx.type}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {formatDate(tx.timestamp)}
                           </p>
                         </div>
                         <div className="text-right">
                           <p
                             className={`text-sm font-medium ${
                               tx.type === "deposit"
                                 ? "text-emerald-400"
                                 : "text-orange-400"
                             }`}
                           >
                             {tx.type === "deposit" ? "+" : "-"}$
                             {tx.amount.toLocaleString()}
                           </p>
                           <p
                             className={`text-xs ${
                               tx.status === "completed"
                                 ? "text-muted-foreground"
                                 : tx.status === "pending"
                                 ? "text-yellow-400"
                                 : "text-red-400"
                             }`}
                           >
                             {tx.status}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>
 
       <DepositModal
         open={depositOpen}
         onOpenChange={setDepositOpen}
         accountName={selectedAccount.name}
       />
       <WithdrawModal
         open={withdrawOpen}
         onOpenChange={setWithdrawOpen}
         accountName={selectedAccount.name}
         currentBalance={selectedAccount.balance}
       />
     </>
   );
 };