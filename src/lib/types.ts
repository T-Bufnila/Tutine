import type { ThemeId } from "./themes";

export interface RoutineItem {
  id?: number;
  weekIndex: number;
  weekday: number;
  title: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tag: string;
  color: string;
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

export type TodoKind = "routine" | "break" | "custom";

export interface Todo {
  id: number;
  date: string;
  kind: TodoKind;
  title: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  tag: string;
  color: string;
  done: boolean;
}

export interface TodayData {
  date: string;
  weekday: number;
  activeRoutineId: number | null;
  activeRoutineName: string | null;
  weekIndex: number;
  todos: Todo[];
}

export interface HistoryDay {
  date: string;
  completed: number;
  total: number;
}

export type WeekStart = "mon" | "sun";

export interface Settings {
  notifications: boolean;
  use24h: boolean;
  weekStart: WeekStart;
  soundEnabled: boolean;
  /** `builtin:<name>` or `custom:<id>`. */
  soundId: string;
  theme: ThemeId;
}

export type SettingKey =
  | "notifications"
  | "time_format"
  | "week_start"
  | "sound_enabled"
  | "sound_id"
  | "theme";

/** An uploaded alert sound; the audio itself is fetched on demand. */
export interface Sound {
  id: number;
  name: string;
}

export type View =
  | { kind: "today" }
  | { kind: "preview"; routineId: number; weekday: number }
  | { kind: "edit"; routineId: number | null }
  | { kind: "history" }
  | { kind: "settings" };
