import { describe, it, expect } from 'vitest';
import { runTradeCalculations, calculateRiskMetrics } from './financialMath';
import { Trade, Execution } from '@/types/trade';
import { Timestamp } from 'firebase/firestore';

// --- 🛠️ TEST FACTORIES ---

const mockTimestamp = (seconds: number) => ({
  seconds,
  nanoseconds: 0,
  toMillis: () => seconds * 1000,
}) as Timestamp;

const createMockTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-test',
  accountId: 'acc-1',
  userId: 'user-1',
  symbol: 'BTC',
  direction: 'LONG',
  status: 'OPEN',
  assetClass: 'CRYPTO',
  
  // Financials
  netQuantity: 0,
  plannedQuantity: 0,
  initialQuantity: 0,
  avgEntryPrice: 0,
  avgExitPrice: 0,
  peakQuantity: 0,
  peakInvested: 0,
  
  // Totals
  totalBuyValue: 0,
  totalSellValue: 0,
  totalExitValue: 0,
  totalExitQuantity: 0,
  totalFees: 0,
  totalSlippage: 0,
  
  // PnL
  grossPnl: 0,
  netPnl: 0,
  realizedPnl: 0,
  returnPercent: 0,
  
  // Risk
  initialStopLoss: 0,
  originalStopLoss: 0,
  takeProfitTarget: 0,
  riskAmount: 0,
  riskMultiple: 0,
  
  // Meta
  entryDate: mockTimestamp(1000000000),
  createdAt: mockTimestamp(1000000000),
  updatedAt: mockTimestamp(1000000000),
  totalExecutions: 0,
  tags: [],
  notes: '',
  screenshots: [],
  
  ...overrides,
} as Trade);

const createMockExecution = (overrides?: Partial<Execution>): Execution => ({
  id: 'exec-1',
  tradeId: 'trade-test',
  accountId: 'acc-1',
  userId: 'user-1',
  date: mockTimestamp(1000000000),
  side: 'BUY',
  price: 0,
  quantity: 0,
  fees: 0,
  notes: '',
  ...overrides,
});

// --- 🧪 TEST SUITE ---

describe('Financial Math Engine', () => {

  // 1️⃣ RISK METRICS TESTS
  describe('calculateRiskMetrics', () => {
    it('calculates Risk Amount ($R) correctly based on planned quantity', () => {
      // Scenario: Entry $100, Stop $90, Qty 10. Risk should be $100.
      const trade = createMockTrade({ 
        initialStopLoss: 90, 
        originalStopLoss: 0 // Should fallback to initial
      });
      
      const result = calculateRiskMetrics(trade, 0, 10, 100, 1000);
      
      expect(result.riskAmount).toBe(100.00); // (100 - 90) * 10
    });

    it('respects Frozen (Original) Stop Loss over Initial Stop Loss', () => {
      // Scenario: Initial SL was 90, but we moved it to 95. Risk calc should use 95 (Frozen logic might vary, but here we test the precedence logic)
      // *Note based on code*: The function uses `originalStopLoss || initialStopLoss`. 
      // Typically `originalStopLoss` is the one set at creation.
      
      const trade = createMockTrade({ 
        initialStopLoss: 95, 
        originalStopLoss: 90 // The "Original" one set at first entry
      });

      const result = calculateRiskMetrics(trade, 0, 10, 100, 1000);
      expect(result.riskAmount).toBe(100.00); // Uses 90, not 95
    });

    it('calculates Realized R-Multiple correctly', () => {
      // Risk $100, Made $250 -> 2.5R
      const trade = createMockTrade({ initialStopLoss: 90 });
      // AvgEntry 100, Qty 10 => Risk = 100
      
      const result = calculateRiskMetrics(trade, 250, 10, 100, 1000);
      expect(result.riskMultiple).toBe(2.50);
    });

    it('calculates Holding Period Return (Capital Efficiency)', () => {
      // Made $200 on a peak investment of $1000 -> 20%
      const trade = createMockTrade();
      const result = calculateRiskMetrics(trade, 200, 0, 0, 1000);
      
      expect(result.holdingPeriodReturn).toBe(20.00);
    });

    it('handles zero division in Reward:Risk calculation', () => {
      const trade = createMockTrade({ 
        initialStopLoss: 100, // Same as entry, risk distance 0
        takeProfitTarget: 110 
      });
      
      const result = calculateRiskMetrics(trade, 0, 10, 100, 1000);
      expect(result.plannedRR).toBe(0); // Should not throw Infinity
    });
  });

  // 2️⃣ TRADE CALCULATION TESTS
  describe('runTradeCalculations', () => {
    
    // --- LONG SCENARIOS ---
    
    it('INITIAL ENTRY: Initializes planned quantity and avg price', () => {
      const trade = createMockTrade();
      const exec = createMockExecution({ side: 'BUY', price: 100, quantity: 10, fees: 5 });

      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(10);
      expect(result.plannedQuantity).toBe(10); // First entry sets plan
      expect(result.avgEntryPrice).toBe(100);
      expect(result.peakInvested).toBe(1000);
      expect(result.totalFees).toBe(5);
      expect(result.status).toBe('OPEN');
    });

    it('SCALE IN: Updates weighted average price', () => {
      // Start: 10 @ 100
      const trade = createMockTrade({ 
        netQuantity: 10, 
        avgEntryPrice: 100, 
        peakInvested: 1000,
        plannedQuantity: 10
      });
      
      // Add: 10 @ 200
      const exec = createMockExecution({ side: 'BUY', price: 200, quantity: 10 });
      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(20);
      expect(result.avgEntryPrice).toBe(150); // (1000 + 2000) / 20
      expect(result.peakInvested).toBe(3000); // 20 * 150
    });

    it('SCALE OUT: Realizes PnL but keeps AvgEntry constant', () => {
      // Start: 10 @ 100
      const trade = createMockTrade({ 
        netQuantity: 10, 
        avgEntryPrice: 100,
        plannedQuantity: 10 
      });

      // Sell: 5 @ 150 (Profit)
      const exec = createMockExecution({ side: 'SELL', price: 150, quantity: 5, fees: 2 });
      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(5);
      expect(result.avgEntryPrice).toBe(100); // Avg Entry SHOULD NOT change on exit
      expect(result.realizedPnl).toBe(250); // (150 - 100) * 5
      expect(result.grossPnl).toBe(250); // No other trades
      expect(result.netPnl).toBe(248); // 250 - 2 fees
      expect(result.totalExitQuantity).toBe(5);
      expect(result.avgExitPrice).toBe(150);
    });

    it('FULL CLOSE: Sets status to CLOSED', () => {
      const trade = createMockTrade({ 
        netQuantity: 5, 
        avgEntryPrice: 100 
      });
      
      const exec = createMockExecution({ side: 'SELL', price: 110, quantity: 5 });
      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(0);
      expect(result.status).toBe('CLOSED');
      expect(result.realizedPnl).toBe(50);
    });

    // --- SHORT SCENARIOS ---

    it('SHORT ENTRY: Handles negative quantity correctly', () => {
      const trade = createMockTrade({ direction: 'SHORT' });
      // Sell to open
      const exec = createMockExecution({ side: 'SELL', price: 100, quantity: 10 });
      
      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(-10);
      expect(result.avgEntryPrice).toBe(100);
      expect(result.peakQuantity).toBe(10); // stored as absolute
    });

    it('SHORT COVER: Calculates profit when buying lower', () => {
      const trade = createMockTrade({ 
        direction: 'SHORT',
        netQuantity: -10, 
        avgEntryPrice: 100 
      });

      // Buy to close @ 80
      const exec = createMockExecution({ side: 'BUY', price: 80, quantity: 10 });
      const result = runTradeCalculations(trade, exec);

      expect(result.netQuantity).toBe(0);
      expect(result.realizedPnl).toBe(200); // (100 - 80) * 10
      expect(result.status).toBe('CLOSED');
    });

    // --- ADVANCED SCENARIOS ---

    it('FLIP POSITION: Long -> Short', () => {
      // Scenario: Long 10 @ 100.
      // Action: Sell 20 @ 90.
      // Logic: Close 10 Long (Loss), Open 10 Short.
      
      const trade = createMockTrade({ 
        netQuantity: 10, 
        avgEntryPrice: 100,
        totalBuyValue: 1000
      });

      const exec = createMockExecution({ side: 'SELL', price: 90, quantity: 20 });
      const result = runTradeCalculations(trade, exec);

      // 1. Check Closure of Long
      // Loss: (90 - 100) * 10 = -100
      expect(result.realizedPnl).toBe(-100); 

      // 2. Check Opening of Short
      expect(result.netQuantity).toBe(-10);
      expect(result.avgEntryPrice).toBe(90); // New cost basis for the short
      expect(result.peakQuantity).toBe(10); // Reset for new leg
    });

    it('SLIPPAGE: Accumulates difference between expected and actual', () => {
      const trade = createMockTrade();
      const exec = createMockExecution({ 
        side: 'BUY', 
        quantity: 10, 
        price: 105, 
        expectedPrice: 100 
      });

      const result = runTradeCalculations(trade, exec);
      expect(result.totalSlippage).toBe(50); // (105 - 100) * 10
    });

    it('TIME METRICS: Calculates duration correctly', () => {
      const start = 1000;
      const end = 4600; // 1 hour later
      
      const trade = createMockTrade({ 
        entryDate: mockTimestamp(start),
        netQuantity: 10
      });

      const exec = createMockExecution({ 
        date: mockTimestamp(end),
        side: 'SELL',
        quantity: 10,
        price: 200 // Profit 1000 (assuming entry 100)
      });
      // Mock trade needs entry price to calc profit velocity
      trade.avgEntryPrice = 100;

      const result = runTradeCalculations(trade, exec);
      
      expect(result.durationSeconds).toBe(3600);
      // PnL 1000 / 1 hour = 1000/hr
      expect(result.profitVelocity).toBe(1000.00);
    });

    it('PRECISION: Handles floating point ghosts', () => {
      const trade = createMockTrade({ netQuantity: 0.3 });
      // Sell 0.1 + 0.2 in floating point math often leaves 0.0000000004
      const exec = createMockExecution({ side: 'SELL', quantity: 0.3, price: 100 });
      
      const result = runTradeCalculations(trade, exec);
      expect(result.netQuantity).toBe(0); // Should be clamped
      expect(result.status).toBe('CLOSED');
    });

  });
});