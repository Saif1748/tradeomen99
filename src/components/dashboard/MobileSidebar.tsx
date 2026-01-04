import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  ChartLine,
  Crosshair,
  CalendarBlank,
  ChartBar,
  Globe,
  Robot,
  X,
  Lightning,
  Gear,
} from "@phosphor-icons/react";
import logo from "@/assets/tradeomen-logo.png";
import SettingsModal from "@/components/settings/SettingsModal";
import { useSettings } from "@/contexts/SettingsContext";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: House },
  { title: "Trades", path: "/trades", icon: ChartLine },
  { title: "Strategies", path: "/strategies", icon: Crosshair },
  { title: "Calendar", path: "/calendar", icon: CalendarBlank },
  { title: "Reports", path: "/reports", icon: ChartBar },
  { title: "Markets", path: "/markets", icon: Globe },
  { title: "AI Chat", path: "/ai-chat", icon: Robot },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

const MobileSidebar = ({ open, onClose }: MobileSidebarProps) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile } = useSettings();

  const handleOpenSettings = () => {
    onClose();
    setSettingsOpen(true);
  };

  const getInitials = () => {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed left-0 top-0 h-screen w-72 z-50 flex flex-col bg-card/95 backdrop-blur-xl border-r border-glass-border md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <img src={logo} alt="TradeOmen" className="h-8 w-auto" />
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors"
                >
                  <X weight="regular" className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Plan Badge */}
              <div className="flex justify-center px-4 py-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-normal text-primary">
                  <Lightning weight="fill" className="w-3 h-3" />
                  Pro Plan
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <Icon
                        weight={isActive ? "fill" : "regular"}
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive ? "text-primary" : "group-hover:text-foreground"
                        }`}
                      />
                      <span className="text-sm font-light">{item.title}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* User Section - Clickable for Settings */}
              <div className="p-4 mt-auto border-t border-border">
                <button
                  onClick={handleOpenSettings}
                  className="w-full group flex items-center gap-3 p-3 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 cursor-pointer relative overflow-hidden"
                  style={{
                    boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 20px 2px rgba(139, 92, 246, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 0 rgba(139, 92, 246, 0)";
                  }}
                >
                  {/* Glow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center text-primary-foreground text-sm font-normal flex-shrink-0 relative z-10">
                    {getInitials()}
                  </div>
                  <div className="flex-1 min-w-0 text-left relative z-10">
                    <p className="text-sm font-normal text-foreground truncate">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-normal bg-primary/20 text-primary mt-0.5">
                      Pro
                    </span>
                  </div>
                  <Gear weight="regular" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors relative z-10" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default MobileSidebar;
