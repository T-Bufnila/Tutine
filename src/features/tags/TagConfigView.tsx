import { useState } from "react";
import { PlusIcon, TrashIcon } from "../../components/Icons";
import { PageHeader } from "../../components/PageHeader";
import { useConfirm } from "../../components/useConfirm";
import type { TagActions } from "../../hooks/useAppData";
import { PALETTE } from "../../lib/constants";
import type { Tag } from "../../lib/types";

const MAX_DESCRIPTION = 60;

interface TagConfigViewProps {
  tags: Tag[];
  actions: TagActions;
}

export function TagConfigView({ tags, actions }: TagConfigViewProps) {
  const [askConfirm, confirmDialog] = useConfirm();

  const unusedColor = PALETTE.find((color) => !tags.some((t) => t.color === color));

  const addTag = () => {
    if (unusedColor) actions.add(unusedColor, "");
  };

  return (
    <div className="page">
      <PageHeader
        title="Tag config"
        subtitle="Tags colour-code your routine items. A description is optional; when set it shows next to the colour on each todo."
      >
        <button
          className="temp-add"
          onClick={addTag}
          disabled={!unusedColor}
          title={unusedColor ? undefined : "Every colour is already used by a tag"}
        >
          <PlusIcon size={18} /> Add tag
        </button>
      </PageHeader>

      {tags.length === 0 ? <p className="empty">No tags yet</p> : null}
      <ul className="tag-list">
        {tags.map((tag) => (
          <TagRow
            key={tag.id}
            tag={tag}
            takenColors={tags.filter((t) => t.id !== tag.id).map((t) => t.color)}
            onColor={(color) => actions.update(tag.id, color, tag.description)}
            onDescription={(description) => actions.update(tag.id, tag.color, description)}
            onDelete={() =>
              askConfirm("Delete this tag? Routine items and todos using it will show no tag.", () =>
                actions.remove(tag.id),
              )
            }
          />
        ))}
      </ul>
      {confirmDialog}
    </div>
  );
}

interface TagRowProps {
  tag: Tag;
  /** Colours used by the other tags. */
  takenColors: string[];
  onColor: (color: string) => void;
  onDescription: (description: string) => void;
  onDelete: () => void;
}

function TagRow({ tag, takenColors, onColor, onDescription, onDelete }: TagRowProps) {
  const [description, setDescription] = useState(tag.description);

  const commit = () => {
    const next = description.trim();
    setDescription(next);
    if (next !== tag.description) onDescription(next);
  };

  return (
    <li className="tag-row">
      <span className="palette">
        {PALETTE.map((color) => {
          const taken = takenColors.includes(color);
          return (
            <button
              key={color}
              className={`swatch-btn ${tag.color === color ? "on" : ""}`}
              style={{ background: color }}
              disabled={taken}
              title={taken ? "Used by another tag" : undefined}
              aria-label={`Colour ${color}`}
              aria-pressed={tag.color === color}
              onClick={() => color !== tag.color && onColor(color)}
            />
          );
        })}
      </span>
      <input
        className="grow"
        placeholder="Description (optional)"
        aria-label="Tag description"
        maxLength={MAX_DESCRIPTION}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <button className="icon del" title="Delete tag" onClick={onDelete}>
        <TrashIcon />
      </button>
    </li>
  );
}
