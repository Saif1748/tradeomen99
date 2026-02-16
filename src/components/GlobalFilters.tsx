import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelSimple,
  CalendarBlank,
  Tag,
  Crosshair,
  ChartLine,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks & Context
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useStrategies } from '@/hooks/useStrategies';
import { useTrades } from '@/hooks/useTrades';

interface FilterConfig {
  dateRange: boolean;
  side: boolean;
  instrument: boolean;
  strategy: boolean;
  tags: boolean;
}

const pageFilters: Record<string, FilterConfig> = {
  '/dashboard': { dateRange: true, side: true, instrument: true, strategy: true, tags: false },
  '/trades': { dateRange: true, side: true, instrument: true, strategy: true, tags: true },
  '/strategies': { dateRange: true, side: false, instrument: true, strategy: false, tags: false },
  '/reports': { dateRange: true, side: true, instrument: true, strategy: true, tags: false },
};

const hiddenPages = ['/calendar', '/ai-chat'];

export function GlobalFilters() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Get Context
  const { activeAccount } = useWorkspace();
  
  // 2. Fetch Dynamic Data
  const { strategies } = useStrategies(activeAccount?.id);
  const { trades } = useTrades(activeAccount?.id);

  // 3. Derive Unique Tags
  const uniqueTags = useMemo(() => {
    if (!trades) return [];
    const allTags = trades.flatMap(t => t.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [trades]);

  const currentPath = location.pathname;
  const filters = pageFilters[currentPath];

  // 4. ✅ FIX: Force "All Time" default in URL on mount
  // This ensures the Trades page doesn't fallback to "30d" locally
  useEffect(() => {
    if (currentPath === '/trades' && !searchParams.has('dateRange')) {
      setSearchParams(prev => {
        prev.set('dateRange', 'all');
        return prev;
      }, { replace: true });
    }
  }, [currentPath, setSearchParams, searchParams]);

  // Sync State with URL Params
  const dateRange = searchParams.get('dateRange') || 'all'; // Default to All
  const side = searchParams.get('side') || 'all';
  const instrument = searchParams.get('type') || 'all'; 
  const strategy = searchParams.get('strategy') || 'all';
  const tags = searchParams.get('tags') || 'all';

  if (!filters || hiddenPages.includes(currentPath)) return null;

  const hasActiveFilters =
    dateRange !== 'all' || side !== 'all' || instrument !== 'all' || strategy !== 'all' || tags !== 'all';

  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value && value !== 'all') {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    });
  };

  const clearAll = () => {
    setSearchParams(prev => {
      // Reset to 'all' explicitly or remove to fallback (we prefer remove)
      prev.delete('dateRange');
      prev.delete('side');
      prev.delete('type');
      prev.delete('strategy');
      prev.delete('tags');
      return prev;
    });
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative p-2 rounded-xl border transition-all duration-200',
          isOpen || hasActiveFilters
            ? 'bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10'
            : 'bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <FunnelSimple weight={hasActiveFilters ? 'fill' : 'regular'} className="w-5 h-5" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-full mt-2 w-[320px] p-4 rounded-2xl bg-card border border-border/50 shadow-2xl backdrop-blur-xl z-50"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {filters.dateRange && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarBlank weight="regular" className="w-3.5 h-3.5" />
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={(v) => updateFilter('dateRange', v)}>
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ✅ Side Filter */}
              {filters.side && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowsLeftRight weight="regular" className="w-3.5 h-3.5" />
                    Side
                  </label>
                  <Select value={side} onValueChange={(v) => updateFilter('side', v)}>
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                      <SelectValue placeholder="All Sides" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sides</SelectItem>
                      <SelectItem value="LONG">Long</SelectItem>
                      <SelectItem value="SHORT">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filters.instrument && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChartLine weight="regular" className="w-3.5 h-3.5" />
                    Instrument (Type)
                  </label>
                  <Select value={instrument} onValueChange={(v) => updateFilter('type', v)}>
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                      <SelectValue placeholder="All Instruments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Instruments</SelectItem>
                      <SelectItem value="STOCK">Stock</SelectItem>
                      <SelectItem value="CRYPTO">Crypto</SelectItem>
                      <SelectItem value="FOREX">Forex</SelectItem>
                      <SelectItem value="FUTURES">Futures</SelectItem>
                      <SelectItem value="OPTIONS">Options</SelectItem>
                      <SelectItem value="INDEX">Index</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filters.strategy && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Crosshair weight="regular" className="w-3.5 h-3.5" />
                    Strategy
                  </label>
                  <Select value={strategy} onValueChange={(v) => updateFilter('strategy', v)}>
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                      <SelectValue placeholder="All Strategies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strategies</SelectItem>
                      
                      {strategies?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                      
                      {strategies?.length === 0 && (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                          No strategies found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filters.tags && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag weight="regular" className="w-3.5 h-3.5" />
                    Tags
                  </label>
                  <Select value={tags} onValueChange={(v) => updateFilter('tags', v)}>
                    <SelectTrigger className="h-9 bg-secondary/50 border-border/50 text-xs">
                      <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      
                      {uniqueTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}

                      {uniqueTags.length === 0 && (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                          No tags found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}