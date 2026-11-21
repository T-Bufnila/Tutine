import type { ReactNode } from "react";

function Svg({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const TrashIcon = () => (
  <Svg>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
  </Svg>
);
export const EditIcon = () => (
  <Svg>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Svg>
);
export const PinIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 17v5M9 3h6l-1 7 3 3v2H7v-2l3-3z" />
  </svg>
);
export const ChevronIcon = ({ open }: { open: boolean }) => (
  <Svg size={14}>{open ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}</Svg>
);
export const SidebarIcon = ({ collapsed }: { collapsed: boolean }) => (
  <Svg size={18}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    {collapsed ? <path d="M14 9l3 3-3 3" /> : <path d="M17 9l-3 3 3 3" />}
  </Svg>
);
export const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4l13 8-13 8z" />
  </svg>
);
export const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);
export const SkipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 4l10 8-10 8zM17 4h3v16h-3z" />
  </svg>
);
export const CheckIcon = () => (
  <Svg size={14}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
);
export const TodayIcon = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);
export const HistoryIcon = () => (
  <Svg>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </Svg>
);
export const TagIcon = () => (
  <Svg>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </Svg>
);
export const SettingsIcon = () => (
  <Svg>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Svg>
);
