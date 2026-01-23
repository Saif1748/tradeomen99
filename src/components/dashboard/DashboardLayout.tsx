import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";
import GlobalHeader from "./GlobalHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onAddTrade?: () => void;
  onAddStrategy?: () => void;
  onAddNote?: () => void;
}

const DashboardLayout = ({ 
  children, 
  onAddTrade, 
  onAddStrategy, 
  onAddNote 
}: DashboardLayoutProps) => {
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
      {/* Fixed Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 240),
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="min-h-screen flex flex-col"
      >
        {/* Global Header */}
        <GlobalHeader 
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          onAddTrade={onAddTrade}
          onAddStrategy={onAddStrategy}
          onAddNote={onAddNote}
        />
        
        {/* Page Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
