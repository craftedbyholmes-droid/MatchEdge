export function filterByMinProfit(opportunities: any[], minPercent: number) {
  return opportunities.filter((o) => Number(o.expectedProfitPercent || 0) >= Number(minPercent || 0));
}
