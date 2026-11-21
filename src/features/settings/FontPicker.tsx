import { FONT_OPTIONS } from "../../lib/typography";
import type { FontId } from "../../lib/typography";

interface FontPickerProps {
  value: FontId;
  onChange: (font: FontId) => void;
}

/** Each card renders its sample in its own font via `data-font`. */
export function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <div className="option-grid" role="radiogroup" aria-label="Font">
      {FONT_OPTIONS.map((option) => (
        <button
          key={option.id}
          role="radio"
          aria-checked={value === option.id}
          className={`option-card font-card ${value === option.id ? "selected" : ""}`}
          data-font={option.id}
          onClick={() => onChange(option.id)}
        >
          <span className="font-sample">Aa</span>
          <span className="font-name">{option.name}</span>
          <span className="muted small">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
