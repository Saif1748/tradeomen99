import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth"; // ✅ Added
import { auth } from "@/lib/firebase";   // ✅ Added
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
  Wallet,
  CaretUpDown,
} from "@phosphor-icons/react";
import logo from "@/assets/tradeomen-logo.png";
import icon from "@/assets/tradeomen-icon.png";
import SettingsModal from "@/components/settings/SettingsModal";
// import { useSettings } from "@/contexts/SettingsContext"; // ❌ Deleted
import { useUser } from "@/contexts/UserContext"; // ✅ New Source of Truth
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AccountModal } from "@/components/accounts/AccountModal";
// import { Skeleton } from "@/components/ui/skeleton"; // Uncomment if you have this component

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: House },
  { title: "Trades", path: "/trades", icon: ChartLine },
  { title: "Strategies", path: "/strategies", icon: Crosshair },
  { title: "Calendar", path: "/calendar", icon: CalendarBlank },
  { title: "Reports", path: "/reports", icon: ChartBar },
  { title: "Markets", path: "/markets", icon: Globe },
  { title: "AI Chat", path: "/ai-chat", icon: Robot },
];

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
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  
  // ✅ FIX 1: Use the new UserContext hook
  const { profile } = useUser();
  const { activeAccount, isLoading: isWorkspaceLoading } = useWorkspace(); 

  // ✅ FIX 2: Safely handle profile data (fallback to "FREE" if profile not loaded yet)
  const userTier = profile?.plan?.tier || "FREE"; 
  const currentPlan = PLAN_STYLES[userTier as keyof typeof PLAN_STYLES] || PLAN_STYLES.FREE;
  const PlanIcon = currentPlan.icon;

  // ✅ FIX 3: Robust Name Handling
  const getDisplayName = () => {
    if (!profile) return "Trader";
    if (profile.displayName) return profile.displayName;
    if (profile.email) return profile.email.split('@')[0];
    return "Trader";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.slice(0, 2).toUpperCase();
  };

  // ✅ FIX 4: Direct Logout implementation
  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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

        {/* Account Selector */}
        <div className={`px-3 pt-2 pb-4 ${collapsed ? "px-2" : ""}`}>
          {isWorkspaceLoading ? (
            <div className="w-full h-[60px] rounded-xl bg-secondary/30 animate-pulse border border-transparent" />
          ) : activeAccount ? (
            <motion.button
              onClick={() => setAccountModalOpen(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full p-3 rounded-xl bg-gradient-to-br from-primary/10 to-glow-secondary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200 group ${collapsed ? "p-2" : ""}`}
            >
              <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-glow-secondary/30 flex items-center justify-center shrink-0">
                  <Wallet weight="fill" className="w-4 h-4 text-primary" />
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
                            {activeAccount.name}
                          </p>
                          <p className={`text-xs font-medium ${activeAccount.balance >= 0 ? "text-primary" : "text-red-400"}`}>
                            {formatBalance(activeAccount.balance)}
                          </p>
                        </div>
                        <CaretUpDown weight="bold" className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ) : (
            <div className="w-full h-[60px] rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <span className="text-xs text-destructive">No Account</span>
            </div>
          )}
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

        {/* User Section (Bottom Footer) */}
        <div className="p-4 mt-2">
          {profile ? (
            <div
              onClick={() => setSettingsOpen(true)}
              className={`group w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 cursor-pointer relative overflow-hidden ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
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
                      {getDisplayName()}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal bg-primary/20 text-primary mt-0.5">
                      {currentPlan.label === "Starter Plan" ? "Free" : currentPlan.label.replace(" Plan", "")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

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
          ) : (
            // User Profile Skeleton
            <div className="w-full h-12 rounded-xl bg-secondary/30 animate-pulse" />
          )}
        </div>
      </motion.aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Account Modal */}
      <AccountModal open={accountModalOpen} onOpenChange={setAccountModalOpen} />
    </>
  );
};

export default AppSidebar;