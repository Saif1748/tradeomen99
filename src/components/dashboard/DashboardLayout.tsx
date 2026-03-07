import { useState, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";
import { GlobalHeader } from "@/components/header/GlobalHeader";
import { cn } from "@/lib/utils";

export type DashboardContextType = {
  onMobileMenuOpen: () => void;
};

export const useDashboard = () => {
  return useOutletContext<DashboardContextType>();
};

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content Area - Push layout based on Aura */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          !isMobile && (sidebarCollapsed ? "ml-[80px]" : "ml-[280px]")
        )}
      >
        {/* Aura-style sticky header */}
        <div className="sticky top-0 z-40 h-16 bg-sidebar/80 backdrop-blur-[20px] border-b border-border shadow-header">
            <GlobalHeader onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        </div>
        
        {/* Main Content Scrollable Area */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ onMobileMenuOpen: () => setMobileMenuOpen(true) } satisfies DashboardContextType} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;