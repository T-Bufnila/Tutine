import { WEEKDAYS } from "../../lib/constants";
import { addMinutes, toMinutes } from "../../lib/time";
import type { RoutineItem } from "../../lib/types";

const DEFAULT_START = "09:00";
const DEFAULT_LENGTH_MIN = 25;
const DEFAULT_BREAK_MIN = 5;

/** Items without a start time sort last. */
function compareStart(a: RoutineItem, b: RoutineItem): number {
  if (a.startTime === b.startTime) return 0;
  if (!a.startTime) return 1;
  if (!b.startTime) return -1;
  return a.startTime.localeCompare(b.startTime);
}

export function itemsForDay(items: RoutineItem[], week: number, weekday: number): RoutineItem[] {
  return items.filter((i) => i.weekIndex === week && i.weekday === weekday).sort(compareStart);
}

/** Groups by day, then orders each day by start time (stable, so ties keep their order). */
export function sortItems<T extends RoutineItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.weekIndex - b.weekIndex || a.weekday - b.weekday || compareStart(a, b));
}

/** A new item that starts where the previous one (plus its break) ended. */
export function createItem(week: number, weekday: number, previous: RoutineItem | undefined): RoutineItem {
  const startTime = previous ? addMinutes(previous.endTime, previous.breakMinutes) : DEFAULT_START;
  return {
    weekIndex: week,
    weekday,
    title: "",
    startTime,
    endTime: addMinutes(startTime, DEFAULT_LENGTH_MIN),
    breakMinutes: DEFAULT_BREAK_MIN,
    tagId: null,
  };
}

/** The span an item occupies: its own time plus the break after it. */
function occupiedSpan(item: RoutineItem): [number, number] | null {
  if (!item.startTime || !item.endTime) return null;
  return [toMinutes(item.startTime), toMinutes(addMinutes(item.endTime, item.breakMinutes))];
}

/** Pairs of indexes (into `items`) that overlap on the same day. Temp todos are not routine items, so they are exempt. */
export function findOverlaps(items: RoutineItem[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let a = 0; a < items.length; a++) {
    const spanA = occupiedSpan(items[a]);
    if (!spanA) continue;
    for (let b = a + 1; b < items.length; b++) {
      if (items[a].weekIndex !== items[b].weekIndex || items[a].weekday !== items[b].weekday) continue;
      const spanB = occupiedSpan(items[b]);
      if (spanB && spanA[0] < spanB[1] && spanB[0] < spanA[1]) pairs.push([a, b]);
    }
  }
  return pairs;
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
  const [overlap] = findOverlaps(items);
  if (overlap) {
    const [a, b] = overlap;
    return `"${items[a].title.trim()}" and "${items[b].title.trim()}" overlap on ${WEEKDAYS[items[a].weekday]}.`;
  }
  return null;
}
