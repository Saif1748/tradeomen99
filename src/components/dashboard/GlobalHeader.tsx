import { useState } from "react";
import {
  CurrencyDollar,
  Bell,
  CaretDown,
  Sun,
  Moon,
  List,
  Plus,
  ChartLineUp,
  Sword,
  Note,
  User,
  Gear,
  SignOut,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SettingsModal from "@/components/settings/SettingsModal";

interface GlobalHeaderProps {
  onMobileMenuOpen: () => void;
  onAddTrade?: () => void;
  onAddStrategy?: () => void;
  onAddNote?: () => void;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

const GlobalHeader = ({ 
  onMobileMenuOpen,
  onAddTrade,
  onAddStrategy,
  onAddNote,
}: GlobalHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { profile, tradingPreferences, setTradingPreferences } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationCount] = useState(3);

  const currentCurrency = currencies.find(c => c.code === tradingPreferences.currency) || currencies[0];

  const handleCurrencyChange = (code: string) => {
    setTradingPreferences({ 
      ...tradingPreferences, 
      currency: code as "USD" | "EUR" | "GBP" | "JPY" 
    });
  };

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "JD";
  };

  const getDisplayName = () => {
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`.trim();
    }
    return "User";
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        {/* Left: Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
          >
            <List weight="regular" className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                <Plus weight="bold" className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-card border-border shadow-lg rounded-xl p-1"
              sideOffset={8}
            >
              <DropdownMenuItem 
                onClick={onAddTrade}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ChartLineUp weight="duotone" className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Trade</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onAddStrategy}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sword weight="duotone" className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Strategy</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onAddNote}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Note weight="duotone" className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Note</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 h-9 sm:h-10 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-all">
                <CurrencyDollar weight="regular" className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{currentCurrency.code}</span>
                <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-44 bg-card border-border shadow-lg rounded-xl p-1"
              sideOffset={8}
            >
              {currencies.map((currency) => (
                <DropdownMenuItem
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentCurrency.code === currency.code 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-secondary/80'
                  }`}
                >
                  <span className="w-6 text-center font-medium">{currency.symbol}</span>
                  <span className="text-sm">{currency.code}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 sm:p-2.5 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-all"
          >
            {theme === "dark" ? (
              <Sun weight="regular" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <Moon weight="regular" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 sm:p-2.5 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-all">
            <Bell weight="regular" className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-all">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    {getInitials()}
                  </span>
                </div>
                <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-card border-border shadow-lg rounded-xl p-1"
              sideOffset={8}
            >
              {/* User Info */}
              <div className="px-3 py-3 border-b border-border/50 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground">Pro Plan</p>
                  </div>
                </div>
              </div>

              <DropdownMenuItem 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <User weight="regular" className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Gear weight="regular" className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuItem 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-destructive/10 transition-colors text-destructive"
              >
                <SignOut weight="regular" className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default GlobalHeader;
