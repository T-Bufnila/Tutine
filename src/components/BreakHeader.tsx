import type { ReactNode } from "react";
import { fmtRange } from "../lib/time";

interface BreakHeaderProps {
  minutes: number;
  startTime: string;
  endTime: string;
  use24h: boolean;
  /** Trailing control, e.g. the done checkbox. */
  children?: ReactNode;
}

/** The single-line "Break · N min · time" row shared by today's list and the routine preview. */
export function BreakHeader({ minutes, startTime, endTime, use24h, children }: BreakHeaderProps) {
  return (
    <div className="break-head">
      <div className="todo-main">
        <span className="todo-title">Break</span>
        <span className="muted small">{minutes} min</span>
      </div>
      <span className="time">{fmtRange(startTime, endTime, use24h)}</span>
      {children}
    </div>
  );
}
