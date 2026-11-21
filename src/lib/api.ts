import { invoke } from "@tauri-apps/api/core";
import { DEFAULT_THEME, isThemeId } from "./themes";
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, isFontId, isFontSize } from "./typography";
import type { HistoryDay, Routine, SettingKey, Settings, Sound, Tag, TodayData } from "./types";

export const DEFAULT_SOUND_ID = "builtin:chime";
export const DEFAULT_SOUND_VOLUME = 100;

export const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  use24h: true,
  weekStart: "mon",
  soundEnabled: true,
  soundId: DEFAULT_SOUND_ID,
  soundVolume: DEFAULT_SOUND_VOLUME,
  theme: DEFAULT_THEME,
  fontFamily: DEFAULT_FONT,
  fontSize: DEFAULT_FONT_SIZE,
};

function parseVolume(raw: string | undefined): number {
  const value = Number(raw);
  return raw && Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), 100) : DEFAULT_SOUND_VOLUME;
}

function parseSettings(raw: Record<string, string>): Settings {
  return {
    notifications: raw.notifications !== "0",
    use24h: raw.time_format !== "12",
    weekStart: raw.week_start === "sun" ? "sun" : "mon",
    soundEnabled: raw.sound_enabled !== "0",
    soundId: raw.sound_id || DEFAULT_SOUND_ID,
    soundVolume: parseVolume(raw.sound_volume),
    theme: raw.theme && isThemeId(raw.theme) ? raw.theme : DEFAULT_THEME,
    fontFamily: raw.font_family && isFontId(raw.font_family) ? raw.font_family : DEFAULT_FONT,
    fontSize: raw.font_size && isFontSize(raw.font_size) ? raw.font_size : DEFAULT_FONT_SIZE,
  };
}

/** Typed wrappers around the Rust commands in src-tauri/src/commands.rs. */
export const api = {
  // Routines
  listRoutines: () => invoke<Routine[]>("list_routines"),
  saveRoutine: (routine: Routine) => invoke<number>("save_routine", { routine }),
  deleteRoutine: (id: number) => invoke<void>("delete_routine", { id }),
  setPinned: (id: number, pinned: boolean) => invoke<void>("set_pinned", { id, pinned }),
  setActiveRoutine: (id: number | null) => invoke<void>("set_active_routine", { id }),

  // Tags
  listTags: () => invoke<Tag[]>("list_tags"),
  addTag: (color: string, description: string) => invoke<void>("add_tag", { color, description }),
  updateTag: (id: number, color: string, description: string) => invoke<void>("update_tag", { id, color, description }),
  deleteTag: (id: number) => invoke<void>("delete_tag", { id }),

  // Today's todos
  getToday: () => invoke<TodayData>("get_today"),
  toggleTodo: (id: number, done: boolean) => invoke<void>("toggle_todo", { id, done }),
  addCustomTodo: (title: string, startTime: string, endTime: string) =>
    invoke<void>("add_custom_todo", { title, startTime, endTime }),
  updateCustomTodo: (id: number, title: string, startTime: string, endTime: string) =>
    invoke<void>("update_custom_todo", { id, title, startTime, endTime }),
  deleteCustomTodo: (id: number) => invoke<void>("delete_custom_todo", { id }),

  // History & settings
  getHistory: (days: number) => invoke<HistoryDay[]>("get_history", { days }),
  getSettings: async () => parseSettings(await invoke<Record<string, string>>("get_settings")),
  setSetting: (key: SettingKey, value: string) => invoke<void>("set_setting", { key, value }),

  // Alert sounds
  listSounds: () => invoke<Sound[]>("list_sounds"),
  /** Sends the MP3 as a raw body; the name travels percent-encoded in a header. */
  addSound: (name: string, bytes: ArrayBuffer) =>
    invoke<Sound>("add_sound", bytes, { headers: { "x-sound-name": encodeURIComponent(name) } }),
  renameSound: (id: number, name: string) => invoke<void>("rename_sound", { id, name }),
  deleteSound: (id: number) => invoke<void>("delete_sound", { id }),
  getSoundData: (id: number) => invoke<ArrayBuffer>("get_sound_data", { id }),
};
