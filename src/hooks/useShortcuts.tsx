import { createContext, useContext, useEffect } from "react";
import { formatShortcut, matchesCombo, SHORTCUTS } from "../lib/shortcuts";
import type { ShortcutId } from "../lib/shortcuts";
import { useLatest } from "./useLatest";

const ShortcutHintsContext = createContext(true);

/** Whether shortcut hints (tooltips, nav labels) should be shown; controlled by a setting. */
export const ShortcutHintsProvider = ShortcutHintsContext.Provider;

/** The formatted shortcut for `id`, or `null` when hints are turned off. */
export function useShortcutHint(id?: ShortcutId): string | null {
  const show = useContext(ShortcutHintsContext);
  return show && id ? formatShortcut(id) : null;
}

/** Appends the shortcut, e.g. "New temp todo (⌘N)", when hints are on. */
export function useHintedLabel(label: string, id: ShortcutId): string {
  const hint = useShortcutHint(id);
  return hint ? `${label} (${hint})` : label;
}

interface ShortcutOptions {
  enabled?: boolean;
  /** Most shortcuts are ignored while a dialog is open; submit shortcuts opt in. */
  inDialog?: boolean;
}

export function useShortcut(
  id: ShortcutId,
  handler: () => void,
  { enabled = true, inDialog = false }: ShortcutOptions = {},
) {
  const handlerRef = useLatest(handler);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || !matchesCombo(e, SHORTCUTS[id].combo)) return;
      if (!inDialog && document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      handlerRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, enabled, inDialog, handlerRef]);
}
