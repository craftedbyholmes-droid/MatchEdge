# Time display + saved bets + scroll fix

This patch addresses three issues:
- event date/time was not always being extracted reliably
- selections logged from compare/plan now flow into saved_bets
- the sidebar and main content now scroll independently

Also included:
- saved bets auto-archive 24 hours after the tracked execution is settled / voided / cancelled
- compare and plan now use a more defensive event-date extraction helper