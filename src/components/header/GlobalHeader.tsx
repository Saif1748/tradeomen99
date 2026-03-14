import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Crown, Rocket, Zap, LogOut, Settings, Menu, ChevronDown,
  Command, Plus, TrendingUp, Lightbulb, PenLine, Users, Bell, Eye,
  Calendar, X, MessageCircle, Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSettings, SupportedCurrency } from "@/contexts/SettingsContext";
import { useTrades } from "@/hooks/useTrades";
import { useTheme } from "@/contexts/ThemeContext";

import SettingsModal from "@/components/settings/SettingsModal";
import { GlobalFilters } from "@/components/GlobalFilters";
import AddTradeModal, { TradeSubmissionPayload } from "@/components/trades/AddTradeModal";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import ThemePanel from "@/components/ThemeSettings";
import { Strategy } from "@/types/strategy";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { AccountModal } from "@/components/accounts/AccountModal";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

interface GlobalHeaderProps {
  onMobileMenuOpen: () => void;
}

const currencies: { value: SupportedCurrency; label: string; symbol: string }[] = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "JPY", label: "JPY", symbol: "¥" },
  { value: "INR", label: "INR", symbol: "₹" },
  { value: "AUD", label: "AUD", symbol: "A$" },
  { value: "CAD", label: "CAD", symbol: "C$" },
  { value: "CNY", label: "CNY", symbol: "¥" },
];

export function GlobalHeader({ onMobileMenuOpen }: GlobalHeaderProps) {
  // --- UI State ---
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Hooks ---
  const { profile, plan, user } = useUser();
  const { activeAccount } = useWorkspace();
  const { tradingPreferences, setTradingPreferences } = useSettings();
  const { resolvedMode } = useTheme();

  const { createTrade } = useTrades(activeAccount?.id, user?.uid);

  const name = profile?.displayName || "Trader";
  const email = profile?.email || "";
  const isTradesPage = location.pathname === "/trades";
  const isDashboard = location.pathname === "/dashboard";

  const getPlanIcon = () => {
    if (plan === "PREMIUM") return Crown;
    if (plan === "PRO") return Rocket;
    return Zap;
  };

  const getPlanColor = () => {
    if (plan === "PREMIUM") return "text-amber-400";
    if (plan === "PRO") return "text-primary";
    return "text-muted-foreground";
  };

  const PlanIcon = getPlanIcon();

  const handleTradeSubmit = async (data: TradeSubmissionPayload) => {
    try {
      if (!activeAccount) {
        toast.error("Please select an active account first");
        return;
      }
      await createTrade(data);
    } catch (error) {
      console.error("Trade submission failed", error);
    }
  };

  const handleStrategyCreate = (strategy: Partial<Strategy>) => {
    toast.success("Strategy created successfully!");
    setStrategyModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to sign out");
    }
  };

  const handleCurrencyChange = (value: SupportedCurrency) => {
    setTradingPreferences({ ...tradingPreferences, currency: value });
    toast.success(`Currency changed to ${value}`);
  };

  const formatBalance = (balance: number) => {
    return Math.abs(balance).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: activeAccount?.currency || 'USD'
    });
  };

  const [searchValue, setSearchValue] = useState<string>(() => searchParams.get("q") || "");
  useEffect(() => {
    if (isTradesPage) setSearchValue(searchParams.get("q") || "");
  }, [searchParams, isTradesPage]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (isTradesPage) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev.toString());
        if (val) next.set("q", val);
        else next.delete("q");
        return next;
      });
    }
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!isDashboard) searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDashboard]);

  return (
    <>
      {/* Replaced <header> with <div className="w-full h-full..."> 
        DashboardLayout is already acting as the <header>. 
      */}
      <div className="w-full h-full flex items-center justify-between px-6 bg-transparent">
        
        {/* --- Left side: Menu toggle & Account selector --- */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:bg-accent"
          >
            <Menu size={20} />
          </button>

          <button 
            onClick={() => setAccountModalOpen(true)}
            className="flex items-center gap-3 outline-none group cursor-pointer px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
              <Crown size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {activeAccount?.name || "Select Account"}
              </span>
              {activeAccount && (
                <span className={cn("text-xs font-medium", activeAccount.balance >= 0 ? "text-success" : "text-loss")}>
                  {formatBalance(activeAccount.balance)}
                </span>
              )}
            </div>
            <ChevronDown size={14} className="text-muted-foreground hidden sm:block ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* --- Center: Global Search --- */}
        <div className="flex-1 flex items-center justify-center max-w-md mx-4">
          <AnimatePresence>
            {!isDashboard && (
              <motion.div
                key="global-search-wrapper"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="hidden md:flex w-full"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 bg-card/50 border border-border rounded-lg px-3 py-2 w-full transition-colors",
                    searchFocused && "border-primary ring-1 ring-primary/20 bg-card"
                  )}
                >
                  <Search size={16} className={cn("text-muted-foreground transition-colors", searchFocused && "text-primary")} />
                  <input
                    id="global-search"
                    ref={searchInputRef}
                    type="text"
                    placeholder={isTradesPage ? "Search trades..." : "Search..."}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 w-full"
                  />
                  <div className="flex items-center justify-center px-1.5 rounded bg-muted/50 text-[10px] font-semibold text-muted-foreground">
                    <Command size={10} className="mr-0.5" />K
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Right side: Actions & Profile --- */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {isTradesPage && (
            <div className="hidden lg:flex items-center mr-2">
              <GlobalFilters />
            </div>
          )}

          {/* Quick Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[60]">
              <DropdownMenuItem onClick={() => setTradeModalOpen(true)} className="cursor-pointer gap-2 py-2">
                <TrendingUp size={16} className="text-primary" /> Add Trade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStrategyModalOpen(true)} className="cursor-pointer gap-2 py-2">
                <Lightbulb size={16} className="text-amber-500" /> New Strategy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Coming soon!")} className="cursor-pointer gap-2 py-2">
                <PenLine size={16} className="text-emerald-500" /> New Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Bell size={18} />
          </button>

          {/* Theme Toggle Panel Button */}
          <button
            onClick={() => setThemePanelOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Palette size={18} />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none ml-1">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-foreground overflow-hidden cursor-pointer shadow-sm hover:opacity-90 transition-opacity" 
                  style={{ backgroundColor: "hsl(36, 90%, 50%)" }}
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 z-[60]">
              <div className="px-3 py-3 bg-muted/30 rounded-lg mb-2 mx-1 mt-1 border border-border/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <div className={cn("flex items-center gap-1 text-[10px] font-medium opacity-80", getPlanColor())}>
                    <PlanIcon size={12} />
                    {plan}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{email}</p>
              </div>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer py-2">
                <Settings size={16} className="mr-3 text-muted-foreground" /> Settings
                <div className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">⌘S</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2">
                <LogOut size={16} className="mr-3" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* --- Modals & Panels --- */}
      <AccountModal open={accountModalOpen} onOpenChange={setAccountModalOpen} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

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

      <ThemePanel 
        open={themePanelOpen} 
        onClose={() => setThemePanelOpen(false)} 
      />
    </>
  );
} 

export default GlobalHeader;