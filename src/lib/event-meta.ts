type CandidateEventLike = {
  eventDate?: string | null;
  commence_time?: string | null;
  startTime?: string | null;
  start_time?: string | null;
  commenceTime?: string | null;
  scheduledAt?: string | null;
  startsAt?: string | null;
};

export function extractEventDate(event: CandidateEventLike | null | undefined) {
  const candidates = [
    event?.eventDate,
    event?.commence_time,
    event?.startTime,
    event?.start_time,
    event?.commenceTime,
    event?.scheduledAt,
    event?.startsAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}