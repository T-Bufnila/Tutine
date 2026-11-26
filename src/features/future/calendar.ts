import { orderedWeekdays } from "../../lib/constants";
import { localDateString, weekdayIndex } from "../../lib/time";
import type { WeekStart } from "../../lib/types";

export interface CalendarCell {
  date: string;
  day: number;
  weekday: number;
}

/** Cells for one month in display order; `null` pads the first row up to the first weekday. */
export function buildMonth(year: number, month: number, weekStart: WeekStart): (CalendarCell | null)[] {
  const first = new Date(year, month, 1);
  const lead = orderedWeekdays(weekStart).indexOf(weekdayIndex(first));
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (CalendarCell | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: localDateString(d), day, weekday: weekdayIndex(d) });
  }
  return cells;
}

/** Parses `YYYY-MM-DD` as a local date. */
export function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
