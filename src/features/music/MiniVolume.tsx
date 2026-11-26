import { useEffect, useRef, useState } from "react";
import { VolumeIcon } from "../../components/Icons";

interface MiniVolumeProps {
  value: number;
  onCommit: (value: number) => void;
}

/** Speaker button that opens a slider popover; the volume is applied when the slider is released. */
export function MiniVolume({ value, onCommit }: MiniVolumeProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mini-volume" ref={root}>
      <button
        className="icon big"
        title="Volume"
        aria-label="Volume"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <VolumeIcon muted={value === 0} />
      </button>
      {open ? (
        <div className="mini-volume-pop">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft}
            aria-label="Volume"
            onChange={(e) => setDraft(Number(e.target.value))}
            onPointerUp={() => onCommit(draft)}
            onKeyUp={() => onCommit(draft)}
          />
          <output>{draft}%</output>
        </div>
      ) : null}
    </div>
  );
}
