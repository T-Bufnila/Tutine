import { TrashIcon } from "../../components/Icons";
import type { RoutineItem, Tag } from "../../lib/types";

interface RoutineItemEditorProps {
  item: RoutineItem;
  tags: Tag[];
  conflict: boolean;
  onChange: (change: Partial<RoutineItem>) => void;
  /** Fired when the start time field loses focus, so the list can re-sort. */
  onStartCommitted: () => void;
  onRemove: () => void;
}

export function RoutineItemEditor({ item, tags, conflict, onChange, onStartCommitted, onRemove }: RoutineItemEditorProps) {
  return (
    <li className={`editor-item ${conflict ? "conflict" : ""}`}>
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
        onBlur={onStartCommitted}
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

      <span className="palette" role="group" aria-label="Tag">
        {tags.length === 0 ? <span className="muted small">No tags yet. Add some in Tag config.</span> : null}
        {tags.map((tag) => (
          <button
            key={tag.id}
            className={`swatch-btn ${item.tagId === tag.id ? "on" : ""}`}
            style={{ background: tag.color }}
            title={tag.description || tag.color}
            aria-pressed={item.tagId === tag.id}
            aria-label={tag.description ? `Tag ${tag.description}` : `Tag ${tag.color}`}
            onClick={() => onChange({ tagId: item.tagId === tag.id ? null : tag.id })}
          />
        ))}
      </span>

      <button className="icon del" title="Remove item" onClick={onRemove}>
        <TrashIcon />
      </button>
    </li>
  );
}
