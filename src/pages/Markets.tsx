import { Globe, Clock, ArrowsClockwise } from "@phosphor-icons/react";
import { useDashboard } from "@/components/dashboard/DashboardLayout"; // 1. Import hook
import PageHeader from "@/components/dashboard/PageHeader";

const Markets = () => {
  // 2. Use the hook to get the menu trigger from parent Layout
  const { onMobileMenuOpen } = useDashboard();
  // 3. Removed local mobileMenuOpen state and DashboardLayout wrapper

  return (
    <>
      <PageHeader
        title="Markets"
        icon={<Globe weight="duotone" className="w-6 h-6 text-primary" />}
        onMobileMenuOpen={onMobileMenuOpen}
        showThemeToggle={false}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-4 flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 sm:p-12 rounded-2xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock weight="duotone" className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-3">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mb-6">
            Real-time market data, watchlists, and price alerts are on the way. Stay tuned for updates.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ArrowsClockwise weight="regular" className="w-4 h-4 animate-spin" />
            <span>In Development</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Markets;