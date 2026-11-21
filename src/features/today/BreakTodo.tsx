import { BreakHeader } from "../../components/BreakHeader";
import { CheckButton } from "../../components/CheckButton";
import type { BreakTimerState } from "../../hooks/useBreakTimers";
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
      <BreakHeader minutes={todo.breakMinutes} startTime={todo.startTime} endTime={todo.endTime} use24h={use24h}>
        <CheckButton checked={todo.done} onToggle={onToggle} size="small" />
      </BreakHeader>

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
