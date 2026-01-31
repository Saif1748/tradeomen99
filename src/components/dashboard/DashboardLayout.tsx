import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Outlet, useOutletContext } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";

// 1. Define the context type that child pages will use
export type DashboardContextType = {
  onMobileMenuOpen: () => void;
};

// 2. Export a custom hook so child pages can easily access the context
export const useDashboard = () => {
  return useOutletContext<DashboardContextType>();
};

const DashboardLayout = () => {
  // No "children" prop needed anymore; we use Outlet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar is rendered once here and stays persistent */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 240),
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="min-h-screen"
      >
        {/* 3. The Outlet renders the current child route (Dashboard, Trades, etc.) */}
        {/* We pass the mobile menu trigger via context */}
        <Outlet context={{ onMobileMenuOpen: () => setMobileMenuOpen(true) } satisfies DashboardContextType} />
      </motion.main>
    </div>
  );
};

export default DashboardLayout;