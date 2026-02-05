import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  ChartLine,
  Crosshair,
  CalendarBlank,
  ChartBar,
  Globe,
  Robot,
  CaretLeft,
  Lightning,
  Sparkle,
  Crown,
  SignOut,
  Plus,   // ✅ Import Plus
  Wallet, // ✅ Import Wallet
} from "@phosphor-icons/react";
import logo from "@/assets/tradeomen-logo.png";
import icon from "@/assets/tradeomen-icon.png";
import SettingsModal from "@/components/settings/SettingsModal";
import { useSettings } from "@/contexts/SettingsContext";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // ✅ Import Workspace Context
import CashModal from "@/components/workspace/CashModal";   // ✅ Import Cash Modal

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: House },
  { title: "Trades", path: "/trades", icon: ChartLine },
  { title: "Strategies", path: "/strategies", icon: Crosshair },
  { title: "Calendar", path: "/calendar", icon: CalendarBlank },
  { title: "Reports", path: "/reports", icon: ChartBar },
  { title: "Markets", path: "/markets", icon: Globe },
  { title: "AI Chat", path: "/ai-chat", icon: Robot },
];

// 1. Define Industry-Grade Badge Styles
const PLAN_STYLES = {
  FREE: {
    label: "Starter Plan",
    icon: Sparkle,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
    iconColor: "text-slate-500",
  },
  PRO: {
    label: "Pro Plan",
    icon: Lightning,
    className: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  PREMIUM: {
    label: "Premium Plan",
    icon: Crown,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
};

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false); // ✅ Cash Modal State
  
  const { profile, logout } = useSettings();
  const { activeAccount } = useWorkspace(); // ✅ Get Active Account Data

  const userTier = (profile as any).tier || "FREE"; 
  const currentPlan = PLAN_STYLES[userTier as keyof typeof PLAN_STYLES] || PLAN_STYLES.FREE;
  const PlanIcon = currentPlan.icon;

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";
    return `${first}${last}` || "U";
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (logout) {
      await logout();
      navigate("/auth");
    }
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex fixed left-0 top-0 h-screen z-50 flex-col bg-card/60 backdrop-blur-xl border-r border-glass-border"
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary/20 transition-colors z-10"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <CaretLeft weight="bold" className="w-3 h-3 text-foreground" />
          </motion.div>
        </button>

        {/* Logo Section */}
        <div className="flex items-center justify-center py-6 px-4 relative h-20">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.img
                key="icon"
                src={icon}
                alt="TradeOmen"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-10 w-auto"
              />
            ) : (
              <motion.img
                key="logo"
                src={logo}
                alt="TradeOmen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-8 w-auto"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Plan Badge */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center px-4 mb-4"
            >
              <div 
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${currentPlan.className}`}
              >
                <PlanIcon weight="fill" className={`w-3.5 h-3.5 ${currentPlan.iconColor}`} />
                {currentPlan.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon
                  weight={isActive ? "fill" : "regular"}
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? "text-primary" : "group-hover:text-foreground"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-light whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* ✅ NEW: Account Balance Section (Just above footer) */}
        <AnimatePresence>
          {!collapsed && activeAccount && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-3 mt-2"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 border border-border/50 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8" />
                
                {/* Header Row */}
                <div className="flex items-center justify-between mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wallet weight="fill" className="w-3.5 h-3.5 opacity-70" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold truncate max-w-[100px]">
                      {activeAccount.name}
                    </span>
                  </div>
                  
                  {/* Manage Funds Button */}
                  <button
                    onClick={() => setCashModalOpen(true)}
                    className="w-5 h-5 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
                    title="Manage Funds"
                  >
                    <Plus weight="bold" className="w-3 h-3" />
                  </button>
                </div>

                {/* Balance Row */}
                <div className="flex items-baseline gap-1 relative z-10">
                  <span className={`text-lg font-bold font-mono tracking-tight ${
                    activeAccount.balance >= 0 ? "text-foreground" : "text-rose-500"
                  }`}>
                    ${activeAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {activeAccount.currency}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Section (Bottom Footer) */}
        <div className="p-4 mt-2">
          <div
            onClick={() => setSettingsOpen(true)}
            className={`group w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 cursor-pointer relative overflow-hidden ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {/* Glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center text-primary-foreground text-sm font-normal flex-shrink-0 relative z-10">
              {profile.photoURL ? (
                  <img src={profile.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                  getInitials()
              )}
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0 overflow-hidden text-left relative z-10"
                >
                  <p className="text-sm font-normal text-foreground truncate">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal bg-primary/20 text-primary mt-0.5">
                    {currentPlan.label === "Starter Plan" ? "Free" : currentPlan.label.replace(" Plan", "")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout Button */}
            <AnimatePresence>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  onClick={handleLogout}
                  className="absolute right-3 z-20 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Logout"
                >
                  <SignOut weight="regular" className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* ✅ Cash Modal */}
      <CashModal open={cashModalOpen} onOpenChange={setCashModalOpen} />
    </>
  );
};

export default AppSidebar;