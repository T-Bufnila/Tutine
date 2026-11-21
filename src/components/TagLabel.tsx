import type { Tag } from "../lib/types";

/** Tag colour dot, followed by a pill with its description when it has one. */
export function TagLabel({ tag }: { tag: Tag | undefined }) {
  if (!tag) return null;
  return (
    <span className="tag">
      <i className="swatch" style={{ background: tag.color }} />
      {tag.description ? <span className="tag-pill">{tag.description}</span> : null}
    </span>
  );
}
