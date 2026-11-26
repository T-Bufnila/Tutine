export type ShortcutId =
  | "history"
  | "tags"
  | "settings"
  | "futureRef"
  | "toggleSidebar"
  | "newTemp"
  | "newRoutine"
  | "save"
  | "addItem"
  | "prevMonth"
  | "nextMonth"
  | "help";

export interface ShortcutDef {
  /** `Mod` is Command on macOS and Ctrl elsewhere. */
  combo: string;
  label: string;
}

export const SHORTCUTS: Record<ShortcutId, ShortcutDef> = {
  history: { combo: "Mod+2", label: "Go to History" },
  tags: { combo: "Mod+3", label: "Go to Tag config" },
  settings: { combo: "Mod+,", label: "Go to Settings" },
  futureRef: { combo: "Mod+F", label: "Open Future Ref" },
  toggleSidebar: { combo: "Mod+B", label: "Collapse or expand the sidebar" },
  newTemp: { combo: "Mod+N", label: "New temp todo" },
  newRoutine: { combo: "Mod+Shift+N", label: "New routine" },
  save: { combo: "Mod+Enter", label: "Save routine, or submit an open form" },
  addItem: { combo: "Mod+I", label: "Add item (routine editor)" },
  prevMonth: { combo: "Mod+Left", label: "Previous month (Future Ref)" },
  nextMonth: { combo: "Mod+Right", label: "Next month (Future Ref)" },
  help: { combo: "Mod+/", label: "Show keyboard shortcuts" },
};

export const IS_MAC = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

const KEY_ALIASES: Record<string, string> = {
  left: "arrowleft",
  right: "arrowright",
  up: "arrowup",
  down: "arrowdown",
};

export function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  // A trailing "+" key (e.g. "Mod++") would split into empty parts.
  const key = parts[parts.length - 1] || "+";
  const mods = new Set(parts.slice(0, -1));

  const modPressed = IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  if (mods.has("mod") !== modPressed) return false;
  if (mods.has("shift") !== e.shiftKey) return false;
  if (mods.has("alt") !== e.altKey) return false;
  return e.key.toLowerCase() === (KEY_ALIASES[key] ?? key);
}

const MAC_SYMBOLS: Record<string, string> = {
  mod: "⌘",
  shift: "⇧",
  alt: "⌥",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  enter: "↵",
};
const OTHER_NAMES: Record<string, string> = { mod: "Ctrl", left: "←", right: "→", up: "↑", down: "↓", enter: "Enter" };

export function formatCombo(combo: string): string {
  const parts = combo.split("+").map((p) => {
    const lower = p.toLowerCase();
    return (IS_MAC ? MAC_SYMBOLS[lower] : OTHER_NAMES[lower]) ?? (p.length === 1 ? p.toUpperCase() : p);
  });
  return IS_MAC ? parts.join("") : parts.join("+");
}

export function formatShortcut(id: ShortcutId): string {
  return formatCombo(SHORTCUTS[id].combo);
}
