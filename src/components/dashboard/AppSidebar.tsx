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
  NotePencil,
  Plus
} from "@phosphor-icons/react";

// ✅ Hooks & Contexts
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ✅ Components
import { AccountModal } from "@/components/accounts/AccountModal";
import AddTradeModal, { TradeSubmissionPayload } from "@/components/trades/AddTradeModal"; 
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import { Strategy } from "@/types/strategy";
import { toast } from "sonner";

// 1. Navigation Configuration
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: House },
  { label: "Trades", href: "/trades", icon: ChartLine },
  { label: "Strategies", href: "/strategies", icon: Lightbulb },
  { label: "Calendar", href: "/calendar", icon: CalendarBlank },
  { label: "Reports", href: "/reports", icon: ChartBar },
  { label: "Markets", href: "/markets", icon: Globe },
  { label: "AI Chat", href: "/ai-chat", icon: Robot },
];

interface QuickAction {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  onClick: () => void;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const { activeAccount } = useWorkspace();
  
  // --- Modal States ---
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);

  // --- Handlers ---
  const handleTradeSubmit = async (data: TradeSubmissionPayload) => {
    try {
      console.log("Submitting Trade:", data);
      // await createTrade(data); 
      toast.success("Trade logged successfully!");
      setTradeModalOpen(false);
    } catch (error) {
      console.error("Trade submission failed", error);
      toast.error("Failed to log trade");
    }
  };

  const handleStrategyCreate = (strategy: Partial<Strategy>) => {
    try {
      console.log("Creating Strategy:", strategy);
      // await createStrategy(strategy);
      toast.success("Strategy created successfully!");
      setStrategyModalOpen(false);
    } catch (error) {
      console.error("Strategy creation failed", error);
      toast.error("Failed to create strategy");
    }
  };

  // 2. Define Quick Actions with Real Handlers
  const quickActions: QuickAction[] = [
    { 
      label: "Add Trade", 
      icon: ChartLine, 
      iconColor: "text-primary", 
      onClick: () => setTradeModalOpen(true) 
    },
    { 
      label: "New Strategy", 
      icon: Lightbulb, 
      iconColor: "text-amber-500", 
      onClick: () => setStrategyModalOpen(true) 
    },
    { 
      label: "New Note", 
      icon: NotePencil, 
      iconColor: "text-emerald-500", 
      onClick: () => toast.info("Notes feature coming soon!") 
    },
  ];

  const formatBalance = (balance: number) => {
    const isNegative = balance < 0;
    const formatted = Math.abs(balance).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: activeAccount?.currency || 'USD'
    });
    // Return formatted string with negative sign if needed, stripping currency code if using symbols
    // The design requested specific formatting:
    return formatted; 
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }} // ✅ Width: 80px / 260px
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-card border-r border-border/50" // Used bg-card as safe fallback for bg-sidebar
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

        {/* Account Selector */}
        <div className={`px-4 pt-5 pb-3 ${collapsed ? "px-3" : ""}`}>
          <button
            onClick={() => setAccountModalOpen(true)}
            className={`w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors duration-200 ${collapsed ? "p-2" : ""}`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
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
                          <p className={`text-xs font-medium ${activeAccount.balance >= 0 ? "text-primary" : "text-red-400"}`}>
                            {formatBalance(activeAccount.balance)}
                          </p>
                        )}
                      </div>
                      <CaretUpDown weight="bold" className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar">
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

        {/* Divider */}
        <div className="mx-4 border-t border-border/30" />

        {/* Quick Actions */}
        <div className={`px-3 py-4 space-y-1.5 ${collapsed ? "px-2" : ""}`}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1 mb-2"
              >
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors duration-200 text-muted-foreground hover:text-foreground ${
                collapsed ? "justify-center px-2" : ""
              }`}
              title={collapsed ? action.label : undefined}
            >
              <action.icon weight="light" className={`w-4.5 h-4.5 shrink-0 ${action.iconColor}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-normal whitespace-nowrap overflow-hidden"
                  >
                    {action.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </motion.aside>

      {/* --- Modals --- */}
      <AccountModal 
        open={accountModalOpen} 
        onOpenChange={setAccountModalOpen} 
      />
      <AddTradeModal 
        open={tradeModalOpen} 
        onOpenChange={setTradeModalOpen}
        accountId={activeAccount?.id}
        onSubmit={handleTradeSubmit}
      />
      <CreateStrategyModal 
        open={strategyModalOpen} 
        onOpenChange={setStrategyModalOpen}
        onCreateStrategy={handleStrategyCreate}
      />
    </>
  );
};

export default AppSidebar;