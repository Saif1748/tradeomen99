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
    <div className="min-h-screen bg-background text-foreground">
      {/* 🟢 1. GLOBAL HEADER (Fixed Top, Full Width) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <GlobalHeader onMobileMenuOpen={() => setMobileMenuOpen(true)} />
      </div>

      {/* 🟢 2. SIDEBAR (Fixed Left, Below Header) */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Mobile Overlay Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* 🟢 3. MAIN CONTENT */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 240),
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="min-h-screen pt-16" // ✅ pt-16 pushes content below header
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet context={{ onMobileMenuOpen: () => setMobileMenuOpen(true) } satisfies DashboardContextType} />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;