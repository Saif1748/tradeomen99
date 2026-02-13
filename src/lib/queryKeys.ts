export const queryKeys = {
  all: ["tradeomen"] as const,
  trades: () => [...queryKeys.all, "trades"] as const,
  tradesByAccount: (accountId: string) => [...queryKeys.trades(), accountId] as const,
  stats: (accountId: string, filters: any) => [...queryKeys.tradesByAccount(accountId), "stats", filters] as const,
  strategies: (accountId: string) => [...queryKeys.all, "strategies", accountId] as const,
};
