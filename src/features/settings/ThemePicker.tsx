import { THEME_OPTIONS } from "../../lib/themes";
import type { ThemeId } from "../../lib/themes";

interface ThemePickerProps {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

/** Each card sets its own `data-theme`, so it previews itself with that theme's colours. */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="theme-grid" role="radiogroup" aria-label="Colour theme">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          role="radio"
          aria-checked={value === option.id}
          className={`theme-card ${value === option.id ? "selected" : ""}`}
          // "system" previews as the OS theme; the card itself just shows a split preview.
          data-theme={option.id === "system" ? undefined : option.id}
          onClick={() => onChange(option.id)}
        >
          {option.id === "system" ? (
            <span className="theme-preview split">
              <span data-theme="light" className="half" />
              <span data-theme="dark" className="half" />
            </span>
          ) : (
            <span className="theme-preview">
              <span className="bar" />
              <span className="line" />
              <span className="line short" />
              <span className="dot" />
            </span>
          )}
          <span className="theme-name">{option.name}</span>
        </button>
      ))}
    </div>
  );
}
