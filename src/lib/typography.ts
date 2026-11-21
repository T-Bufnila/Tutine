export type FontId = "system" | "readable" | "serif" | "mono";
export type FontSize = "small" | "default" | "large";

interface FontOption {
  id: FontId;
  name: string;
  description: string;
}

/** Font stacks live in styles/typography.css, keyed by `data-font`. */
export const FONT_OPTIONS: FontOption[] = [
  { id: "system", name: "System", description: "Your platform's interface font" },
  { id: "readable", name: "Readable", description: "Wide, open letterforms" },
  { id: "serif", name: "Serif", description: "Classic book-style text" },
  { id: "mono", name: "Monospace", description: "Fixed-width characters" },
];

export const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

export const DEFAULT_FONT: FontId = "system";
export const DEFAULT_FONT_SIZE: FontSize = "default";

const FONT_KEY = "fontFamily";
const SIZE_KEY = "fontSize";

export function isFontId(value: string): value is FontId {
  return FONT_OPTIONS.some((f) => f.id === value);
}

export function isFontSize(value: string): value is FontSize {
  return FONT_SIZE_OPTIONS.some((s) => s.value === value);
}

export function applyTypography(font: FontId, size: FontSize) {
  const root = document.documentElement;
  root.dataset.font = font;
  root.dataset.fontSize = size;
}

/** Cached copy so the chosen font paints before the backend responds. */
export function cacheTypography(font: FontId, size: FontSize) {
  localStorage.setItem(FONT_KEY, font);
  localStorage.setItem(SIZE_KEY, size);
}

export function applyCachedTypography() {
  const font = localStorage.getItem(FONT_KEY) ?? "";
  const size = localStorage.getItem(SIZE_KEY) ?? "";
  applyTypography(isFontId(font) ? font : DEFAULT_FONT, isFontSize(size) ? size : DEFAULT_FONT_SIZE);
}
