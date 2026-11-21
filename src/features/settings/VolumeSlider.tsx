import { useEffect, useState } from "react";

interface VolumeSliderProps {
  value: number;
  disabled?: boolean;
  /** Fires when the user releases the slider, not on every step while dragging. */
  onCommit: (value: number) => void;
}

export function VolumeSlider({ value, disabled, onCommit }: VolumeSliderProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <div className="volume">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={draft}
        disabled={disabled}
        aria-label="Alert volume"
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={() => onCommit(draft)}
        onKeyUp={() => onCommit(draft)}
      />
      <output>{draft}%</output>
    </div>
  );
}
