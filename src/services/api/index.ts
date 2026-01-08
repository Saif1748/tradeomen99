// src/services/api/index.ts
import { tradesApi } from "./modules/trades";
import { strategiesApi } from "./modules/strategies";
import { aiApi } from "./modules/ai";
import { brokersApi } from "./modules/brokers";
import { newsApi } from "./modules/news";

export { ApiError } from "./core";
export * from "./types";

// Unified API Object
export const api = {
  trades: tradesApi,
  strategies: strategiesApi,
  ai: aiApi,
  brokers: brokersApi,
  news: newsApi,
};

export default api;