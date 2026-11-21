import { MONTHS } from "../../lib/constants";
import { localDateString } from "../../lib/time";
import type { HistoryDay, WeekStart } from "../../lib/types";

export type HistoryMap = Map<string, HistoryDay>;

interface HeatCell {
  date: string;
  day: HistoryDay | undefined;
  future: boolean;
}

const YEAR_DAYS = 364;

// --- Shared helpers ----------------------------------------------------------

/** 0–4 intensity bucket from the number of completed todos. */
export function heatLevel(completed: number): number {
  if (completed <= 0) return 0;
  if (completed <= 2) return 1;
  if (completed <= 4) return 2;
  if (completed <= 6) return 3;
  return 4;
}

export function describeCell(cell: HeatCell): string {
  const label = new Date(`${cell.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (cell.future) return label;
  return cell.day ? `${cell.day.completed} of ${cell.day.total} done · ${label}` : `Nothing tracked · ${label}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Days between `d` and the start of its week (0–6). */
function weekOffset(d: Date, weekStart: WeekStart): number {
  const first = weekStart === "sun" ? 0 : 1;
  return (d.getDay() - first + 7) % 7;
}

function cellFor(d: Date, byDate: HistoryMap, todayStr: string): HeatCell {
  const date = localDateString(d);
  return { date, day: byDate.get(date), future: date > todayStr };
}

// --- Range boundaries ----------------------------------------------------------

export function monthStart(now: Date): string {
  return localDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function yearStart(now: Date): string {
  return localDateString(addDays(startOfDay(now), -YEAR_DAYS));
}

// --- Grids -------------------------------------------------------------------

/** Calendar cells for the current month, padded with `null` to align weekdays. */
export function buildMonthGrid(byDate: HistoryMap, weekStart: WeekStart, now: Date): (HeatCell | null)[] {
  const todayStr = localDateString(now);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const cells: (HeatCell | null)[] = Array(weekOffset(first, weekStart)).fill(null);
  for (let i = 0; i < daysInMonth; i++) cells.push(cellFor(addDays(first, i), byDate, todayStr));
  return cells;
}

/** GitHub-style columns of weeks covering the last year. */
export function buildYearGrid(byDate: HistoryMap, weekStart: WeekStart, now: Date) {
  const end = startOfDay(now);
  const todayStr = localDateString(end);
  let cursor = addDays(end, -YEAR_DAYS);
  cursor = addDays(cursor, -weekOffset(cursor, weekStart));

  const weeks: (HeatCell | null)[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;

  while (cursor <= end) {
    if (cursor.getMonth() !== lastMonth) {
      monthLabels.push({ col: weeks.length, label: MONTHS[cursor.getMonth()] });
      lastMonth = cursor.getMonth();
    }
    const column: (HeatCell | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const cell = cellFor(cursor, byDate, todayStr);
      column.push(cell.future ? null : cell);
      cursor = addDays(cursor, 1);
    }
    weeks.push(column);
  }
  return { weeks, monthLabels };
}

// --- Stats -------------------------------------------------------------------

export function computeStats(days: HistoryDay[]) {
  let completed = 0;
  let total = 0;
  let activeDays = 0;
  let best = 0;
  for (const d of days) {
    completed += d.completed;
    total += d.total;
    if (d.completed > 0) activeDays++;
    best = Math.max(best, d.completed);
  }
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, activeDays, best, rate };
}

/** Consecutive days with at least one completion, ending today (or yesterday). */
export function currentStreak(byDate: HistoryMap, now: Date): number {
  let cursor = startOfDay(now);
  const doneOn = (d: Date) => (byDate.get(localDateString(d))?.completed ?? 0) > 0;
  if (!doneOn(cursor)) cursor = addDays(cursor, -1);

  let streak = 0;
  while (doneOn(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
