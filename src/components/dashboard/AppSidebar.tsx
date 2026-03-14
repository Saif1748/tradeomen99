import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Table2,
  Lightbulb,
  CalendarDays,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Wallet,
  LayoutGrid,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",        href: "/dashboard",        icon: LayoutDashboard },
  { label: "Custom Dashboard",  href: "/custom-dashboard",  icon: LayoutGrid },
  { label: "Trades",            href: "/trades",            icon: Table2 },
  { label: "Strategies",        href: "/strategies",        icon: Lightbulb },
  { label: "Calendar",          href: "/calendar",          icon: CalendarDays },
  { label: "Reports",           href: "/reports",           icon: BarChart3 },
  { label: "AI Chat",           href: "/ai-chat",           icon: Sparkles,       badge: "NEW" },
  { label: "Notebook",          href: "/notebook",          icon: BookOpen },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();

  return (
    <>
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 transition-all duration-300 flex flex-col sidebar-container",
          collapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center h-16 px-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              T
            </div>
            {!collapsed && (
              <span className="text-sm font-bold text-foreground tracking-wide">Tradeomen</span>
            )}
          </div>
        </div>

        {/* Menu label */}
        {!collapsed && (
          <div className="px-6 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary opacity-60">
              Menu
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.label}
                to={item.href}
                className={cn(
                  "w-full flex items-center gap-3 h-11 rounded-lg px-3 transition-colors text-sm font-normal",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-text-secondary hover:bg-sidebar-accent/50 hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Edge toggle button — perfectly matched to visual-canvas styling */}
        <button
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 rounded-full border border-sidebar-border shadow-md flex items-center justify-center text-text-secondary hover:text-foreground hover:border-primary/40 transition-all duration-200 z-10"
          style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
};

export default AppSidebar;