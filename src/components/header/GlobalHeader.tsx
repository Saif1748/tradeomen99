import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Crown,
  Rocket,
  Lightning,
  Sun,
  Moon,
  SignOut,
  Gear,
  List,
  CaretDown,
  Command,
  Plus,
  ChartLine,
  Lightbulb,
  NotePencil
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSettings, SupportedCurrency } from "@/contexts/SettingsContext";
import { useTrades } from "@/hooks/useTrades";

import SettingsModal from "@/components/settings/SettingsModal";
import { GlobalFilters } from "@/components/GlobalFilters";
import AddTradeModal, { TradeSubmissionPayload } from "@/components/trades/AddTradeModal";
import CreateStrategyModal from "@/components/strategies/CreateStrategyModal";
import { Strategy } from "@/types/strategy";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import tradeOmenLogo from "@/assets/tradeomen-logo.png";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

interface GlobalHeaderProps {
  onMobileMenuOpen: () => void;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/trades": "Trades",
  "/strategies": "Strategies",
  "/calendar": "Calendar",
  "/reports": "Reports",
  "/markets": "Markets",
  "/ai-chat": "AI Chat",
};

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

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Hooks ---
  const { profile, plan, user } = useUser();
  const { activeAccount } = useWorkspace();
  const { tradingPreferences, setTradingPreferences } = useSettings();
  const { theme, setTheme } = useTheme();

  // Initialize Trade Hook
  const { createTrade } = useTrades(activeAccount?.id, user?.uid);

  const name = profile?.displayName || "Trader";
  const email = profile?.email || "";
  const currentPageTitle = routeTitles[location.pathname] || "Dashboard";
  const isDark = theme === "dark";
  const isTradesPage = location.pathname === "/trades";
  const isDashboard = location.pathname === "/dashboard";

  // --- Derived Styles ---
  const getPlanIcon = () => {
    if (plan === "PREMIUM") return Crown;
    if (plan === "PRO") return Rocket;
    return Lightning;
  };

  const getPlanColor = () => {
    if (plan === "PREMIUM") return "text-amber-400";
    if (plan === "PRO") return "text-primary";
    return "text-muted-foreground";
  };

  const PlanIcon = getPlanIcon();

  // --- Handlers ---
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
    setTradingPreferences({
      ...tradingPreferences,
      currency: value
    });
    toast.success(`Currency changed to ${value}`);
  };

  // Controlled search state (keeps q param for trades page)
  const [searchValue, setSearchValue] = useState<string>(() => searchParams.get("q") || "");
  useEffect(() => {
    if (isTradesPage) {
      setSearchValue(searchParams.get("q") || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Keyboard Shortcuts: focus search only if present on this route
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

  // Shared "Glass" Button Style (unchanged)
  const actionButtonClass = cn(
    "flex items-center justify-center rounded-xl h-9 sm:h-10 transition-all duration-300 cursor-pointer backdrop-blur-sm",
    "bg-secondary/30 hover:bg-secondary/50",
    "border border-border/40 hover:border-primary/30",
    "text-sm font-medium text-muted-foreground hover:text-foreground"
  );

  // Framer spring config for smooth expansion (keeps visual behavior)
  const expandSpring = { type: "spring", stiffness: 220, damping: 28 };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex-shrink-0 transition-all duration-300">
        {/* --- Background & Glow Effects --- */}
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-2xl bg-card/60 z-0" />
        <div className="absolute top-0 left-1/4 w-96 h-full bg-primary/10 blur-3xl opacity-50 z-0 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-full bg-glow-secondary/10 blur-3xl opacity-50 z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent z-10" />

        <div className="relative z-20 h-full flex items-center justify-between px-6 lg:px-8">
          {/* --- Left Section: Brand & Nav --- */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              onClick={onMobileMenuOpen}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              <List weight="bold" className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <img
                  src={tradeOmenLogo}
                  alt="TradeOmen"
                  className="h-8 w-auto brightness-110"
                />
              </motion.div>

              <div className="hidden md:block w-px h-5 bg-border/60" />

              <span className="hidden md:block text-sm font-medium tracking-tight text-muted-foreground/90">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* --- Center: Search (centered between left & right) --- */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence>
              {!isDashboard && (
                <motion.div
                  key="global-search-wrapper"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="hidden md:flex"
                >
                  {/* keep original container classes & sizing; animate only input width for identical look */}
                  <div
                    className={cn(
                      actionButtonClass,
                      "relative px-3 cursor-text justify-between group min-w-[200px] flex"
                    )}
                    // preserve same look when focused
                    aria-hidden={false}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <MagnifyingGlass className={cn("w-4 h-4 text-muted-foreground/70 transition-colors", searchFocused && "text-primary")} />

                      {/* motion input: animates width smoothly but keeps original classes/appearance */}
                      <motion.input
                        id="global-search"
                        key={isTradesPage ? "trade-search" : "global-search"}
                        ref={searchInputRef}
                        type="text"
                        placeholder={isTradesPage ? "Search trades..." : "Search..."}
                        value={searchValue}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 p-0"
                        // animate width between the same sizes you used before (w-32 → focus:w-48)
                        initial={false}
                        animate={{ width: searchFocused ? "12rem" : "8rem" }}
                        transition={expandSpring}
                        style={{ minWidth: 0 }} // allow flex shrinking
                      />
                    </div>

                    <div className="flex items-center justify-center h-5 px-1.5 ml-2 rounded bg-background/40 border border-border/40 shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground/80 flex items-center gap-0.5">
                        <Command weight="bold" className="w-2.5 h-2.5" />K
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- Right Section: Actions --- */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Global Filters */}
            {isTradesPage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:flex items-center"
              >
                <GlobalFilters />
              </motion.div>
            )}

            {/* Quick Add Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    actionButtonClass,
                    "w-9 sm:w-10 px-0 text-primary border-primary/20 bg-primary/10 hover:bg-primary/20 hover:border-primary/40"
                  )}
                >
                  <Plus weight="bold" className="w-4 h-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/60 shadow-xl rounded-xl p-1.5">
                <DropdownMenuItem onClick={() => setTradeModalOpen(true)} className="cursor-pointer gap-2 py-2.5">
                  <ChartLine className="w-4 h-4 text-primary" /> Add Trade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStrategyModalOpen(true)} className="cursor-pointer gap-2 py-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> New Strategy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Coming soon!")} className="cursor-pointer gap-2 py-2.5">
                  <NotePencil className="w-4 h-4 text-emerald-500" /> New Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Selector */}
            <Select value={tradingPreferences.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className={cn(actionButtonClass, "hidden sm:flex h-9 w-auto gap-2 px-3 text-xs font-medium focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-secondary/50 data-[state=open]:border-primary/40")}>
                <span className="text-foreground/90">{currencies.find(c => c.value === tradingPreferences.currency)?.symbol}</span>
                <span className="text-xs text-muted-foreground ml-0.5">{tradingPreferences.currency}</span>
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[140px] bg-card/95 backdrop-blur-xl border-border/60 shadow-xl">
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-sm cursor-pointer focus:bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground w-4 text-center">{c.symbol}</span>
                      <span>{c.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(actionButtonClass, "w-9 h-9 p-0 rounded-full")}
            >
              <motion.div key={isDark ? "moon" : "sun"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                {isDark ? <Moon weight="fill" className="w-4 h-4 text-sky-400" /> : <Sun weight="fill" className="w-4 h-4 text-amber-500" />}
              </motion.div>
            </motion.button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={cn(actionButtonClass, "gap-3 pl-1.5 pr-3 hover:bg-secondary/40 group border-transparent hover:border-border/40 bg-transparent hover:bg-secondary/20")}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full ring-2 ring-background/50 shadow-sm bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center overflow-hidden">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
                  </div>

                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-foreground leading-none">{name}</p>
                    <p className={cn("text-[10px] font-medium leading-tight flex items-center gap-1 mt-0.5 opacity-80", getPlanColor())}>
                      <PlanIcon weight="fill" className="w-3 h-3" />
                      {plan}
                    </p>
                  </div>
                  <CaretDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border/60 shadow-xl rounded-xl p-2">
                <div className="px-3 py-3 bg-secondary/20 rounded-lg mb-2 border border-border/20">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary">
                  <Gear className="w-4 h-4 mr-3" /> Settings
                  <div className="ml-auto text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground">⌘S</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50 my-2" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2.5 rounded-lg">
                  <SignOut className="w-4 h-4 mr-3" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* --- Modals --- */}
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
    </>
  );
}

export default GlobalHeader;
