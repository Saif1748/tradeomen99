import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Outlet, useOutletContext } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";
import { GlobalHeader } from "@/components/header/GlobalHeader";

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    // 1. Lock the viewport: Full height, no body scroll
    <div className="h-screen w-full bg-background text-foreground overflow-hidden flex flex-col">
      
      {/* 2. Global Header: Fixed Top, Full Width, Z-Index High */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50">
        <GlobalHeader onMobileMenuOpen={() => setMobileMenuOpen(true)} />
      </div>

      {/* 3. Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* 4. Main Content Area - Scrollbar Logic */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 240),
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        // ✅ CRITICAL FIXES: 
        // mt-16: Pushes content start point below the header
        // h-[calc(100vh-4rem)]: Forces height to fill exactly the rest of the screen
        // overflow-y-auto: Generates scrollbar ONLY for this area
        className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar bg-background"
      >
        {/* ✅ SPACING FIX: 
           - px-4 sm:px-6: Keeps the horizontal buffer (Sidebar gap).
           - pt-2: Reduces the top gap to be minimal (8px), letting the Page component 
             add its own padding without creating a huge double-gap.
           - pb-8: Adds nice breathing room at the bottom.
        */}
        <div className="w-full max-w-[1600px] mx-auto min-h-full px-4 sm:px-6 pt-2 pb-8">
          <Outlet context={{ onMobileMenuOpen: () => setMobileMenuOpen(true) } satisfies DashboardContextType} />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;