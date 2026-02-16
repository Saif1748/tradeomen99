import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  ChartLine,
  Lightbulb,
  CalendarBlank,
  ChartBar,
  Globe,
  Robot,
  CaretLeft,
  CaretRight,
  Wallet,
  CaretUpDown,
} from "@phosphor-icons/react";

// ✅ Hooks & Contexts
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ✅ Components
import { AccountModal } from "@/components/accounts/AccountModal";

// 1. Navigation Configuration
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
  
  // --- Modal States ---
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const formatBalance = (balance: number) => {
    const formatted = Math.abs(balance).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: activeAccount?.currency || 'USD'
    });
    return formatted; 
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }} // ✅ Width: 80px / 260px
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-card border-r border-border/50" 
      >
        {/* Toggle Button (Vertically Centered) */}
        <button
          onClick={onToggle}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card border border-border/60 hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10 shadow-sm"
        >
          {collapsed ? (
            <CaretRight weight="bold" className="w-3.5 h-3.5" />
          ) : (
            <CaretLeft weight="bold" className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Navigation - Takes available space */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.label}>
                  <NavLink
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-primary/[0.08] text-foreground font-medium border-l-[3px] border-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border-l-[3px] border-transparent"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      weight={isActive ? "duotone" : "light"}
                      className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`text-[15px] whitespace-nowrap overflow-hidden ${isActive ? "font-medium" : "font-normal"}`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Account Selector Section - Anchored at Bottom */}
        <div className="mt-auto">
            {/* Divider */}
            <div className="mx-4 border-t border-border/30 mb-3" />
            
            <div className={`px-4 pb-5 ${collapsed ? "px-3" : ""}`}>
            <button
                onClick={() => setAccountModalOpen(true)}
                className={`w-full p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors duration-200 border border-border/30 hover:border-primary/20 ${collapsed ? "p-2" : ""}`}
            >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
                    <Wallet weight="duotone" className="w-4 h-4 text-primary" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 text-left overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                            {activeAccount?.name || "Select Account"}
                            </p>
                            {activeAccount && (
                            <p className={`text-xs font-medium ${activeAccount.balance >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                                {formatBalance(activeAccount.balance)}
                            </p>
                            )}
                        </div>
                        <CaretUpDown weight="bold" className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 ml-2" />
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </button>
            </div>
        </div>
      </motion.aside>

      {/* --- Modals --- */}
      <AccountModal 
        open={accountModalOpen} 
        onOpenChange={setAccountModalOpen} 
      />
    </>
  );
};

export default AppSidebar;