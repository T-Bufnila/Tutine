import { CheckButton } from "../../components/CheckButton";
import type { BreakTimerState } from "../../hooks/useBreakTimers";
import { fmtRange } from "../../lib/time";
import type { Todo } from "../../lib/types";
import { BreakTimer } from "./BreakTimer";

interface BreakTodoProps {
  todo: Todo;
  timer: BreakTimerState | undefined;
  use24h: boolean;
  /** Locked until the todo before the break is completed. */
  locked: boolean;
  onToggle: () => void;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
}

export function BreakTodo({ todo, timer, use24h, locked, onToggle, onStart, onPause, onSkip }: BreakTodoProps) {
  const state = todo.done ? "done" : locked ? "locked" : "ready";

  return (
    <li className={`todo break ${state}`}>
      <div className="break-head">
        <div className="todo-main">
          <span className="todo-title">Break</span>
          <span className="muted small">{todo.breakMinutes} min</span>
        </div>
        <span className="time">{fmtRange(todo.startTime, todo.endTime, use24h)}</span>
        <CheckButton checked={todo.done} onToggle={onToggle} size="small" />
      </div>

      <div className={`break-expand ${state === "ready" ? "open" : ""}`} inert={state !== "ready"}>
        <div className="break-expand-inner">
          <BreakTimer
            remainingSeconds={timer?.remaining ?? todo.breakMinutes * 60}
            running={timer?.running ?? false}
            started={timer !== undefined}
            disabled={locked}
            onStart={onStart}
            onPause={onPause}
            onSkip={onSkip}
          />
        </div>
      </div>
    </li>
  );
}
