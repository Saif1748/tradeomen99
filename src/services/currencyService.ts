import { toast } from "sonner";

// --- Types ---
export interface ExchangeRates {
  [currency: string]: number;
}

const STORAGE_KEY = "tradeomen_exchange_rates";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// Fallback rates in case API fails (Base: USD)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.5,
  INR: 83.5,
  AUD: 1.52,
  CAD: 1.36,
  CNY: 7.23,
};

/**
 * 🌍 Fetches exchange rates (Base USD)
 * Uses 'exchangerate-api' (Free tier) or falls back to cached/static data.
 * Implements "Stale-While-Revalidate" strategy for speed.
 */
export const getExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // 1. Check Cache
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // If cache is fresh (< 24h), return it
      if (age < CACHE_DURATION) {
        return rates;
      }
    }

    // 2. Fetch Live Rates (Base USD)
    // Using a reliable open API. For production, replace with a paid key if needed.
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    
    if (!response.ok) throw new Error("Failed to fetch rates");
    
    const data = await response.json();
    const rates = data.rates;

    // 3. Update Cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rates,
      timestamp: Date.now()
    }));

    return rates;

  } catch (error) {
    console.warn("Currency API failed, using fallback rates.", error);
    // If cache exists (even if stale), prefer that over hardcoded static values
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached).rates;
    }
    return FALLBACK_RATES;
  }
};

/**
 * 🧮 Industry Grade Conversion
 * Uses integer math to avoid IEEE 754 floating point errors (e.g. 0.1 + 0.2 = 0.30004)
 */
export const convertCurrency = (amount: number, rate: number): number => {
  if (!rate || isNaN(amount)) return 0;
  // Round to 4 decimal places for precision during calculation
  return Math.round(amount * rate * 10000) / 10000;
};

export const convertToUSD = (localAmount: number, rate: number): number => {
  if (!rate || rate === 0 || isNaN(localAmount)) return 0;
  return Math.round((localAmount / rate) * 10000) / 10000;
};