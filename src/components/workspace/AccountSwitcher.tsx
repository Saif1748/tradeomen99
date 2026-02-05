import { CaretUpDown, Check, Plus, UserCircle, Users } from "@phosphor-icons/react";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // ✅ Fixed import path (context vs contexts)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AccountSwitcher = () => {
  const { activeAccount, availableAccounts, switchAccount, createNewAccount, isLoading } = useWorkspace();

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full px-2 py-2">
        <Skeleton className="h-14 w-full rounded-xl bg-secondary/30" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between gap-2 px-3 py-6 h-auto bg-secondary/10 border border-border/40 hover:bg-secondary/30 hover:border-border/80 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Account Icon Avatar */}
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:border-primary/20 transition-colors">
              <span className="text-primary font-bold text-sm">
                {activeAccount?.name.charAt(0).toUpperCase() || "J"}
              </span>
            </div>
            
            {/* Text Info (Name & Balance) */}
            <div className="flex flex-col items-start overflow-hidden text-left flex-1 min-w-0">
              <span className="text-sm font-semibold truncate w-full text-foreground">
                {activeAccount?.name || "Personal Journal"}
              </span>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium shrink-0">
                  {activeAccount?.members && Object.keys(activeAccount.members).length > 1 ? "Team" : "Personal"}
                </span>
                {/* Active Balance Indicator */}
                <span className="text-[10px] font-mono text-emerald-500/80 ml-auto truncate">
                  ${(activeAccount?.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <CaretUpDown weight="bold" className="text-muted-foreground/50 w-4 h-4 shrink-0 group-hover:text-foreground transition-colors" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 bg-card border-border/60 rounded-xl p-1.5 shadow-xl backdrop-blur-xl" align="start" sideOffset={8}>
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 py-1.5 font-semibold">
          Switch Workspace
        </DropdownMenuLabel>
        
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
          {availableAccounts.map((acc) => (
            <DropdownMenuItem
              key={acc.id}
              onClick={() => switchAccount(acc.id)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                activeAccount?.id === acc.id 
                  ? "bg-primary/10 text-primary focus:bg-primary/15" 
                  : "focus:bg-secondary/50 text-foreground/80"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                {Object.keys(acc.members).length > 1 ? (
                   <Users className="w-4 h-4 opacity-70 shrink-0" />
                ) : (
                   <UserCircle className="w-4 h-4 opacity-70 shrink-0" />
                )}
                <span className="font-medium truncate text-sm">{acc.name}</span>
              </div>

              {/* ✅ Financial Status Indicator */}
              <div className="flex flex-col items-end shrink-0 ml-2">
                <span className={`text-[11px] font-bold font-mono ${
                  (acc.balance || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  ${(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider scale-90 origin-right opacity-70">
                   {acc.currency || 'USD'}
                </span>
              </div>

            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-border/40 my-1.5" />
        
        <DropdownMenuItem 
          className="rounded-lg px-3 py-2.5 text-muted-foreground focus:text-primary cursor-pointer focus:bg-secondary/50 gap-3"
          onClick={() => {
            const name = prompt("Enter new workspace name (e.g. 'Prop Firm Challenge'):");
            if (name && name.trim()) createNewAccount(name.trim());
          }}
        >
          <div className="w-4 h-4 flex items-center justify-center border border-current border-dashed rounded-md opacity-60">
            <Plus weight="bold" className="w-2.5 h-2.5" />
          </div>
          <span className="font-medium">Create New Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher;