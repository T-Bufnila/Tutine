import { WEEKDAYS } from "../../lib/constants";
import { addMinutes } from "../../lib/time";
import type { RoutineItem } from "../../lib/types";

const DEFAULT_START = "09:00";
const DEFAULT_LENGTH_MIN = 25;
const DEFAULT_BREAK_MIN = 5;

export function itemsForDay(items: RoutineItem[], week: number, weekday: number): RoutineItem[] {
  return items
    .filter((i) => i.weekIndex === week && i.weekday === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** A new item that starts where the previous one (plus its break) ended. */
export function createItem(week: number, weekday: number, previous: RoutineItem | undefined, color: string): RoutineItem {
  const startTime = previous ? addMinutes(previous.endTime, previous.breakMinutes) : DEFAULT_START;
  return {
    weekIndex: week,
    weekday,
    title: "",
    startTime,
    endTime: addMinutes(startTime, DEFAULT_LENGTH_MIN),
    breakMinutes: DEFAULT_BREAK_MIN,
    tag: "",
    color,
  };
}

/** Returns a user-facing error message, or `null` if the routine is valid. */
export function validateRoutine(name: string, items: RoutineItem[]): string | null {
  if (!name.trim()) return "Give the routine a name.";
  for (const item of items) {
    const day = WEEKDAYS[item.weekday];
    if (!item.title.trim()) return `An item on ${day} has no title.`;
    if (!item.startTime || !item.endTime || item.endTime <= item.startTime) {
      return `"${item.title}" on ${day} needs an end time after its start time.`;
    }
  }
  return null;
}
