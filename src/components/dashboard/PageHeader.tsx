import { List, Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onMobileMenuOpen?: () => void;
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  onMobileMenuOpen,
  children,
}: PageHeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors mt-0.5"
          >
            <List weight="regular" className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h1 className="text-xl sm:text-2xl font-medium text-foreground tracking-tight-premium">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
          >
            {theme === "dark" ? (
              <Sun weight="regular" className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon weight="regular" className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
