export function build7DayPlan(events: any[], minProfit = 0) {
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);

  return events
    .filter((e) => {
      const start = new Date(e.startTime || e.commence_time || e.start_time || now);
      return start >= now && start <= in7Days;
    })
    .filter((e) => Number(e.expectedProfitPercent || 0) >= Number(minProfit || 0))
    .sort((a, b) => Number(b.expectedProfitPercent || 0) - Number(a.expectedProfitPercent || 0));
}
