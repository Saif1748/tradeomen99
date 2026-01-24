import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
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

  // Clone children and inject mobile menu handler
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Check if it's a PageHeader by looking at the component
      const childType = child.type as { displayName?: string; name?: string } | string;
      const componentName = typeof childType === 'function' 
        ? (childType as { displayName?: string; name?: string }).displayName || (childType as { displayName?: string; name?: string }).name 
        : '';
      
      if (componentName === 'PageHeader') {
        return React.cloneElement(child as React.ReactElement<{ onMobileMenuOpen?: () => void }>, {
          onMobileMenuOpen: () => setMobileMenuOpen(true)
        });
      }
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-background">
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
        {childrenWithProps}
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
