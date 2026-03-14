// src/data/strategies.ts
/**
 * Stub file — satisfies the `@/data/strategies` import in widgetRegistry.tsx.
 * Strategy widgets now receive live data via WidgetRenderer props (useStrategies hook)
 * instead of reading from a static sample array.
 */

export interface SampleStrategy {
  id: string;
  name: string;
  emoji: string;
  metrics: {
    netPnl: number;
    winRate: number;
    totalTrades: number;
  };
}

export const sampleStrategies: SampleStrategy[] = [];
