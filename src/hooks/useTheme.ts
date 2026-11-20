import { useEffect } from "react";
import {
  applyResolvedTheme,
  cacheTheme,
  resolveTheme,
  systemPrefersDark,
  watchSystemTheme,
} from "../lib/themes";
import type { ThemeId } from "../lib/themes";

/** Applies the chosen theme to the document, following the OS when set to "system". */
export function useTheme(theme: ThemeId) {
  useEffect(() => {
    cacheTheme(theme);
    applyResolvedTheme(resolveTheme(theme, systemPrefersDark()));
    if (theme !== "system") return;
    return watchSystemTheme((dark) => applyResolvedTheme(resolveTheme(theme, dark)));
  }, [theme]);
}
