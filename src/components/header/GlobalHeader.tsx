import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Command,
  CaretDown,
  Crown,
  Rocket,
  Lightning,
  Sun,
  Moon,
  CurrencyDollar,
  SignOut,
  Gear,
  List // ✅ Added List icon for mobile menu
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
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

// ✅ Added Props Interface for Mobile Toggle
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

const currencies = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "JPY", label: "JPY", symbol: "¥" },
  { value: "INR", label: "INR", symbol: "₹" },
];

export function GlobalHeader({ onMobileMenuOpen }: GlobalHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { profile, plan, role } = useUser();
  const { theme, setTheme } = useTheme();

  const name = profile?.displayName || "Trader";
  const email = profile?.email || "";
  const currency = profile?.settings?.currency || "USD";
  const currentPageTitle = routeTitles[location.pathname] || "Dashboard";

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
  const isDark = theme === "dark";

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

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-card flex-shrink-0">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          
          {/* --- Left Section --- */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* 🍔 Mobile Menu Trigger */}
            <button
              onClick={onMobileMenuOpen}
              className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <List weight="bold" className="w-5 h-5" />
            </button>

            {/* Logo & Title */}
            <div className="flex items-center gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }} // ✅ Subtle hover effect
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => navigate("/dashboard")} // ✅ Clickable Logo
              >
                <img
                  src={tradeOmenLogo}
                  alt="TradeOmen"
                  className="h-8 w-auto"
                />
              </motion.div>

              <div className="hidden md:block w-px h-6 bg-border/50" />

              <span className="hidden md:block text-sm font-normal text-muted-foreground">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* --- Right Section --- */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "hidden md:flex relative items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                "bg-secondary/50 border border-border/50",
                searchFocused && "border-primary/50 bg-secondary shadow-lg shadow-primary/10"
              )}
            >
              <MagnifyingGlass className="w-4 h-4 text-muted-foreground" />
              <input
                id="global-search"
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-32 focus:w-48 transition-all duration-300"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50">
                <Command className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">K</span>
              </div>
            </motion.div>

            {/* Currency */}
            <Select value={currency} disabled>
              <SelectTrigger className="hidden sm:flex w-[80px] h-9 bg-secondary/50 border-border/50 rounded-xl text-xs focus:ring-0">
                <div className="flex items-center gap-1.5">
                  <CurrencyDollar weight="bold" className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-sm">
                    {c.symbol} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? (
                  <Moon weight="fill" className="w-5 h-5" />
                ) : (
                  <Sun weight="fill" className="w-5 h-5" />
                )}
              </motion.div>
            </motion.button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 p-1.5 pr-2 sm:pr-3 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow overflow-hidden">
                    {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-medium text-primary-foreground">
                        {name.charAt(0).toUpperCase()}
                        </span>
                    )}
                  </div>

                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-normal text-foreground leading-tight max-w-[100px] truncate">
                      {name}
                    </p>
                    <p className={cn("text-[10px] font-medium leading-tight flex items-center gap-1 mt-0.5", getPlanColor())}>
                      <PlanIcon weight="fill" className="w-3 h-3" />
                      {plan}
                      {role === "admin" && (
                        <span className="text-amber-400">• ADMIN</span>
                      )}
                    </p>
                  </div>

                  <CaretDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 bg-card border-border/50 shadow-xl rounded-xl p-2">
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