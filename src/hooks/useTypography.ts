import { useEffect } from "react";
import { applyTypography, cacheTypography } from "../lib/typography";
import type { FontId, FontSize } from "../lib/typography";

export function useTypography(font: FontId, size: FontSize) {
  useEffect(() => {
    cacheTypography(font, size);
    applyTypography(font, size);
  }, [font, size]);
}
