const TZ = "America/Recife";

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: TZ });
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

export function formatDateTime(d: Date): string {
  return `${formatDateShort(d)} · ${formatTime(d)}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** yyyy-mm-dd para inputs type=date */
export function toDateInputValue(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Hoje, no formato de input date. */
export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

/** Amanhã, no formato de input date (default dos formulários de busca). */
export function tomorrowInputValue(): string {
  return toDateInputValue(new Date(Date.now() + 86_400_000));
}
