export function fmtTime(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  } catch {
    return "—";
  }
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

export function sameDay(d1: string | null | undefined, d2: Date): boolean {
  if (!d1) return false;
  try {
    return new Date(d1).toDateString() === d2.toDateString();
  } catch {
    return false;
  }
}
