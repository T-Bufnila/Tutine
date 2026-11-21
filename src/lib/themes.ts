import { getCurrentWindow } from "@tauri-apps/api/window";

export type ThemeId =
  | "system"
  | "dark"
  | "light"
  | "gruvbox-dark"
  | "gruvbox-light"
  | "nord"
  | "dracula"
  | "solarized-dark"
  | "solarized-light";

/** A concrete theme; "system" resolves to one of these. */
type ResolvedTheme = Exclude<ThemeId, "system">;

interface ThemeOption {
  id: ThemeId;
  name: string;
}

/** Colours for each theme live in styles/themes.css, keyed by `data-theme`. */
export const THEME_OPTIONS: ThemeOption[] = [
  { id: "system", name: "System" },
  { id: "dark", name: "Dark" },
  { id: "light", name: "Light" },
  { id: "gruvbox-dark", name: "Gruvbox Dark" },
  { id: "gruvbox-light", name: "Gruvbox Light" },
  { id: "nord", name: "Nord" },
  { id: "dracula", name: "Dracula" },
  { id: "solarized-dark", name: "Solarized Dark" },
  { id: "solarized-light", name: "Solarized Light" },
];

export const DEFAULT_THEME: ThemeId = "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemeId(value: string): value is ThemeId {
  return THEME_OPTIONS.some((t) => t.id === value);
}

export function resolveTheme(theme: ThemeId, systemDark: boolean): ResolvedTheme {
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme;
}

export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function watchSystemTheme(listener: (dark: boolean) => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const onChange = (e: MediaQueryListEvent) => listener(e.matches);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

const LIGHT_THEMES = new Set<ResolvedTheme>(["light", "gruvbox-light", "solarized-light"]);

/** Matches the native title bar to the theme; `null` lets the OS decide. */
export function syncWindowTheme(theme: ThemeId) {
  const value = theme === "system" ? null : LIGHT_THEMES.has(theme) ? "light" : "dark";
  getCurrentWindow()
    .setTheme(value)
    .catch(() => {
      // Not supported on every platform (e.g. some Linux desktops); purely cosmetic.
    });
}

/**
 * The database is the source of truth; this cached copy only lets the right theme
 * paint before the first backend response arrives.
 */
export function applyCachedTheme() {
  const cached = localStorage.getItem(STORAGE_KEY);
  const theme = cached && isThemeId(cached) ? cached : DEFAULT_THEME;
  applyResolvedTheme(resolveTheme(theme, systemPrefersDark()));
}

export function cacheTheme(theme: ThemeId) {
  localStorage.setItem(STORAGE_KEY, theme);
}
