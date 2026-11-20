const LAST_MINUTE = 23 * 60 + 59;

const pad = (n: number) => String(n).padStart(2, "0");

// --- Dates -------------------------------------------------------------------

/** `YYYY-MM-DD` in local time. */
export function localDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function fmtLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

// --- Times (HH:MM strings) ---------------------------------------------------

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const clamped = Math.min(Math.max(total, 0), LAST_MINUTE);
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

export function addMinutes(t: string, minutes: number): string {
  return fromMinutes(toMinutes(t) + minutes);
}

export function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function isWithin(now: Date, start: string, end: string): boolean {
  if (!start || !end) return false;
  const m = nowMinutes(now);
  return m >= toMinutes(start) && m < toMinutes(end);
}

// --- Formatting --------------------------------------------------------------

export function fmtTime(t: string, use24h: boolean): string {
  if (!t || use24h) return t;
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

export function fmtRange(start: string, end: string, use24h: boolean): string {
  if (!start) return "";
  return end ? `${fmtTime(start, use24h)} - ${fmtTime(end, use24h)}` : fmtTime(start, use24h);
}

/** Seconds as `MM:SS`. */
export function fmtClock(totalSeconds: number): string {
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}
