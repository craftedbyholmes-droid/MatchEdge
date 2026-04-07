export function splitEventTeams(eventName?: string | null) {
  const value = String(eventName || "").trim();
  if (!value) {
    return {
      event: "",
      homeTeam: "",
      awayTeam: "",
      combinedSearch: "",
    };
  }

  const separators = [" vs ", " v ", " @ ", " - "];

  for (const separator of separators) {
    if (value.includes(separator)) {
      const parts = value.split(separator).map((item) => item.trim()).filter(Boolean);

      if (parts.length >= 2) {
        return {
          event: value,
          homeTeam: parts[0],
          awayTeam: parts[1],
          combinedSearch: `${parts[0]} ${parts[1]}`.trim(),
        };
      }
    }
  }

  return {
    event: value,
    homeTeam: value,
    awayTeam: "",
    combinedSearch: value,
  };
}

export function buildSelectionSearchText(input: {
  eventName?: string | null;
  outcome?: string | null;
  bookmaker?: string | null;
}) {
  const eventName = String(input.eventName || "").trim();
  const outcome = String(input.outcome || "").trim();
  const bookmaker = String(input.bookmaker || "").trim();

  return [eventName, outcome, bookmaker].filter(Boolean).join(" • ");
}