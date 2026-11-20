import type { WeekStart } from "./types";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PALETTE = ["#a855f7", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#ec4899", "#9ca3af"];

const MONDAY_FIRST = [0, 1, 2, 3, 4, 5, 6];
const SUNDAY_FIRST = [6, 0, 1, 2, 3, 4, 5];

/** Weekday indexes (Mon = 0) in display order. */
export function orderedWeekdays(weekStart: WeekStart): number[] {
  return weekStart === "sun" ? SUNDAY_FIRST : MONDAY_FIRST;
}
