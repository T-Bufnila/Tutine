import type { ReactNode } from "react";
import { useShortcutHint } from "../../hooks/useShortcuts";
import type { ShortcutId } from "../../lib/shortcuts";

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  collapsed: boolean;
  shortcut?: ShortcutId;
  badge?: boolean;
  onClick: () => void;
}

export function NavButton({ icon, label, selected, collapsed, shortcut, badge, onClick }: NavButtonProps) {
  const shown = useShortcutHint(shortcut);
  return (
    <button
      className={`nav ${selected ? "selected" : ""}`}
      title={shown ? `${label} (${shown})` : label}
      aria-label={label}
      onClick={onClick}
    >
      {icon}
      {collapsed ? null : label}
      {collapsed || !shown ? null : <kbd className="kbd">{shown}</kbd>}
      {badge ? <span className="nav-badge" aria-label="Update available" /> : null}
    </button>
  );
}
