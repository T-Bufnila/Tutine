import { TrashIcon } from "../../components/Icons";
import { PALETTE } from "../../lib/constants";
import type { RoutineItem } from "../../lib/types";

interface RoutineItemEditorProps {
  item: RoutineItem;
  onChange: (change: Partial<RoutineItem>) => void;
  onRemove: () => void;
}

export function RoutineItemEditor({ item, onChange, onRemove }: RoutineItemEditorProps) {
  return (
    <li className="editor-item">
      <input
        className="grow"
        placeholder="Title"
        aria-label="Title"
        value={item.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <input
        type="time"
        aria-label="Start time"
        value={item.startTime}
        onChange={(e) => onChange({ startTime: e.target.value })}
      />
      <input type="time" aria-label="End time" value={item.endTime} onChange={(e) => onChange({ endTime: e.target.value })} />

      <label className="inline" title="Break after (minutes)">
        <input
          type="number"
          min={0}
          max={120}
          value={item.breakMinutes}
          onChange={(e) => onChange({ breakMinutes: Math.max(0, Number(e.target.value) || 0) })}
        />
        <span className="muted small">min break</span>
      </label>

      <input
        className="tag-input"
        placeholder="Tag"
        aria-label="Tag"
        value={item.tag}
        onChange={(e) => onChange({ tag: e.target.value })}
      />

      <span className="palette">
        {PALETTE.map((color) => (
          <button
            key={color}
            className={`swatch-btn ${item.color === color ? "on" : ""}`}
            style={{ background: color }}
            onClick={() => onChange({ color })}
            aria-label={`Colour ${color}`}
          />
        ))}
      </span>

      <button className="icon del" title="Remove item" onClick={onRemove}>
        <TrashIcon />
      </button>
    </li>
  );
}
