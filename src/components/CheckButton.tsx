import { CheckIcon } from "./Icons";

interface CheckButtonProps {
  checked: boolean;
  onToggle: () => void;
  size?: "normal" | "small";
}

export function CheckButton({ checked, onToggle, size = "normal" }: CheckButtonProps) {
  return (
    <button
      className={`check ${size} ${checked ? "on" : ""}`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Mark as not done" : "Mark as done"}
    >
      {checked ? <CheckIcon /> : null}
    </button>
  );
}
