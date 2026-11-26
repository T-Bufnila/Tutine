import type { ThemeId } from "./themes";
import type { FontId, FontSize } from "./typography";

export interface RoutineItem {
  id?: number;
  weekIndex: number;
  weekday: number;
  title: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tagId: number | null;
}

/** A shared colour label; the description is optional. */
export interface Tag {
  id: number;
  color: string;
  description: string;
}

export interface Routine {
  id?: number;
  name: string;
  weeks: number;
  startDate: string;
  pinned: boolean;
  currentWeek: number;
  items: RoutineItem[];
}

type TodoKind = "routine" | "break" | "custom";

export interface Todo {
  id: number;
  kind: TodoKind;
  title: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tagId: number | null;
  done: boolean;
  /** A note left in advance via Future Ref. */
  note: string | null;
}

export interface TodayData {
  date: string;
  weekday: number;
  activeRoutineId: number | null;
  activeRoutineName: string | null;
  todos: Todo[];
}

/** A routine item as scheduled on a future date. */
export interface FutureItem {
  title: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tagId: number | null;
  note: string | null;
}

export interface FutureDay {
  date: string;
  routineId: number | null;
  routineName: string | null;
  items: FutureItem[];
}

export interface HistoryDay {
  date: string;
  completed: number;
  total: number;
}

export type WeekStart = "mon" | "sun";

export interface Settings {
  notifications: boolean;
  showShortcuts: boolean;
  use24h: boolean;
  weekStart: WeekStart;
  soundEnabled: boolean;
  /** `builtin:<name>` or `custom:<id>`. */
  soundId: string;
  /** 0-100. */
  soundVolume: number;
  theme: ThemeId;
  fontFamily: FontId;
  fontSize: FontSize;
}

export type SettingKey =
  | "notifications"
  | "show_shortcuts"
  | "time_format"
  | "week_start"
  | "sound_enabled"
  | "sound_id"
  | "sound_volume"
  | "theme"
  | "font_family"
  | "font_size";

/** An uploaded alert sound; the audio itself is fetched on demand. */
export interface Sound {
  id: number;
  name: string;
}

export type View =
  | { kind: "today" }
  | { kind: "preview"; routineId: number; weekday: number }
  | { kind: "edit"; routineId: number | null }
  | { kind: "future"; date: string | null }
  | { kind: "history" }
  | { kind: "tags" }
  | { kind: "settings" };
