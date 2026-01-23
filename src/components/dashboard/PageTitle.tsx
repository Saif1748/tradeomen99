import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const PageTitle = ({ title, subtitle, icon, children }: PageTitleProps) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-foreground tracking-tight-premium">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 sm:gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageTitle;
