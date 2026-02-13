import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Crown,
  Rocket,
  Lightning,
  Sun,
  Moon,
  CurrencyDollar,
  SignOut,
  Gear,
  List,
  CaretDown
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useSettings, SupportedCurrency } from "@/contexts/SettingsContext"; // ✅ Use Settings Context
import SettingsModal from "@/components/settings/SettingsModal";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🟢 Hooks
  const { profile, plan } = useUser();
  const { tradingPreferences, setTradingPreferences } = useSettings(); // ✅ Get Preferences
  const { theme, setTheme } = useTheme();

  const name = profile?.displayName || "Trader";
  const email = profile?.email || "";
  const currentPageTitle = routeTitles[location.pathname] || "Dashboard";
  const isDark = theme === "dark";

  // 🎨 Derived Styles
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

  // ⌨️ Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Shared "Glass" Button Style
  const actionButtonClass = "flex items-center justify-center rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 text-sm text-muted-foreground cursor-pointer";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex-shrink-0">
        {/* Background & Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-2xl bg-card/60 z-0" />
        <div className="absolute top-0 left-1/4 w-96 h-full bg-primary/10 blur-3xl opacity-50 z-0 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-full bg-glow-secondary/10 blur-3xl opacity-50 z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent z-10" />

        <div className="relative z-20 h-full flex items-center justify-between px-6">
          
          {/* --- Left Section --- */}
          <div className="flex items-center gap-6">
            
            {/* 🍔 Mobile Menu Trigger */}
            <button
              onClick={onMobileMenuOpen}
              className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <List weight="bold" className="w-5 h-5" />
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <img
                  src={tradeOmenLogo}
                  alt="TradeOmen"
                  className="h-8 w-auto brightness-125"
                />
              </motion.div>

              <div className="hidden md:block w-px h-6 bg-gradient-to-b from-transparent via-border to-transparent" />

              <span className="hidden md:block text-sm font-light text-muted-foreground">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* --- Right Section --- */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                actionButtonClass,
                "hidden md:flex relative px-3 py-2 cursor-text",
                searchFocused && "bg-secondary/60 border-primary/30 shadow-sm"
              )}
            >
              <MagnifyingGlass className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                id="global-search"
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/70 w-32 focus:w-48 transition-all duration-300"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="flex items-center justify-center h-5 px-1.5 rounded bg-background/80 border border-border/80">
                <span className="text-[10px] text-muted-foreground font-medium">⌘K</span>
              </div>
            </motion.div>

            {/* 💰 Currency Selector (Fixed UI) */}
            <Select 
              value={tradingPreferences.currency} 
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger 
                className={cn(
                  actionButtonClass, 
                  "hidden sm:flex h-9 w-auto gap-2 px-3 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-secondary/60 data-[state=open]:border-primary/30"
                )}
              >
                <CurrencyDollar weight="bold" className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent align="end" className="bg-card border-border/50 backdrop-blur-xl">
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-sm cursor-pointer focus:bg-secondary/50">
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium w-4 text-center">{c.symbol}</span>
                      <span>{c.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(actionButtonClass, "w-9 h-9 p-0")}
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? (
                  <Moon weight="fill" className="w-4 h-4" />
                ) : (
                  <Sun weight="fill" className="w-4 h-4" />
                )}
              </motion.div>
            </motion.button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    actionButtonClass,
                    "gap-3 pl-1.5 pr-2 sm:pr-3 py-1.5 hover:bg-secondary/80 group"
                  )}
                >
                  <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center overflow-hidden">
                    {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-medium text-white">
                        {name.charAt(0).toUpperCase()}
                        </span>
                    )}
                  </div>

                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-normal text-foreground leading-tight max-w-[100px] truncate">
                      {name}
                    </p>
                    <p className={cn("text-[10px] font-light leading-tight flex items-center gap-1 mt-0.5", getPlanColor())}>
                      <PlanIcon weight="fill" className="w-3 h-3" />
                      {plan}
                    </p>
                  </div>

                  <CaretDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 bg-card border-border/50 shadow-xl rounded-xl p-2 backdrop-blur-xl">
                <div className="px-3 py-3 bg-secondary/30 rounded-lg mb-2">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                
                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                  className="cursor-pointer py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
                >
                  <Gear className="w-4 h-4 mr-3" />
                  Settings
                  <div className="ml-auto text-[10px] bg-border px-1.5 py-0.5 rounded">⌘S</div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-border/50 my-2" />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2.5 rounded-lg"
                >
                  <SignOut className="w-4 h-4 mr-3" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default GlobalHeader;