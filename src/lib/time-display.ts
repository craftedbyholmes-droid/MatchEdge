export function parseEventDate(input?: string | null) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function getEventTimestamp(input?: string | null) {
  const date = parseEventDate(input);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

export function formatEventDateTime(input?: string | null) {
  const date = parseEventDate(input);
  if (!date) return "Time unavailable";

  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCountdownMeta(input?: string | null) {
  const date = parseEventDate(input);
  if (!date) {
    return {
      label: "Time unavailable",
      status: "none" as const,
      hoursLeft: null as number | null,
    };
  }

  const diffMs = date.getTime() - Date.now();

  if (diffMs <= 0) {
    return {
      label: "Started",
      status: "started" as const,
      hoursLeft: 0,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let label = "";
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    label = `${days}d ${hours}h left`;
  } else if (totalHours >= 1) {
    label = `${totalHours}h ${minutes}m left`;
  } else {
    label = `${minutes}m left`;
  }

  let status: "urgent" | "soon" | "normal";
  if (diffMs <= 2 * 60 * 60 * 1000) {
    status = "urgent";
  } else if (diffMs <= 6 * 60 * 60 * 1000) {
    status = "soon";
  } else {
    status = "normal";
  }

  return {
    label,
    status,
    hoursLeft: Number((diffMs / 3600000).toFixed(2)),
  };
}