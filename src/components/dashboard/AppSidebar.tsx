import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  House,
  ChartLine,
  Lightbulb,
  CalendarBlank,
  ChartBar,
  Robot,
  Wallet,
} from "@phosphor-icons/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Hooks & Contexts
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ✅ Components
import { AccountModal } from "@/components/accounts/AccountModal";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: House },
  { label: "Trades", href: "/trades", icon: ChartLine },
  { label: "Strategies", href: "/strategies", icon: Lightbulb },
  { label: "Calendar", href: "/calendar", icon: CalendarBlank },
  { label: "Reports", href: "/reports", icon: ChartBar },
  { label: "AI Chat", href: "/ai-chat", icon: Robot },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const { activeAccount } = useWorkspace();
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const formatBalance = (balance: number) => {
    return Math.abs(balance).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: activeAccount?.currency || 'USD'
    });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar shadow-sidebar z-50 transition-all duration-300 flex flex-col border-r border-border",
          collapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            {!collapsed && <span className="font-bold text-lg tracking-tight">Tradeomen</span>}
          </div>
        </div>

        {/* Menu label */}
        {!collapsed && (
          <div className="px-6 pt-4 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Menu
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-sidebar">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.label}
                to={item.href}
                className={cn(
                  "w-full flex items-center gap-3 h-11 rounded-lg px-3 transition-colors text-sm font-normal",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon weight={isActive ? "fill" : "regular"} className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Account Selector Section */}
        <div className="p-3">
          <button
            onClick={() => setAccountModalOpen(true)}
            className={cn(
                "w-full flex items-center gap-3 h-12 rounded-lg px-3 transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent/50 border border-border bg-card/50",
                collapsed && "justify-center px-0"
            )}
          >
            <Wallet className="w-5 h-5 shrink-0 text-muted-foreground" />
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activeAccount?.name || "Select Account"}
                </p>
                {activeAccount && (
                  <p className={cn("text-xs font-medium", activeAccount.balance >= 0 ? "text-success" : "text-loss")}>
                    {formatBalance(activeAccount.balance)}
                  </p>
                )}
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Toggle button at the edge of sidebar exactly like Aura */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-[51] w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 shadow-sm",
          collapsed ? "left-[68px]" : "left-[268px]"
        )}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <AccountModal open={accountModalOpen} onOpenChange={setAccountModalOpen} />
    </>
  );
};

export default AppSidebar;