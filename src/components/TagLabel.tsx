/** Coloured dot with an optional tag name. Renders nothing if both are empty. */
export function TagLabel({ tag, color }: { tag: string; color: string }) {
  if (!tag && !color) return null;
  return (
    <span className="tag">
      <i className="swatch" style={{ background: color || undefined }} />
      {tag}
    </span>
  );
}
