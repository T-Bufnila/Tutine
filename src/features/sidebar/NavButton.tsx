import type { ReactNode } from "react";

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  collapsed: boolean;
  onClick: () => void;
}

export function NavButton({ icon, label, selected, collapsed, onClick }: NavButtonProps) {
  return (
    <button className={`nav ${selected ? "selected" : ""}`} title={label} aria-label={label} onClick={onClick}>
      {icon}
      {collapsed ? null : label}
    </button>
  );
}
