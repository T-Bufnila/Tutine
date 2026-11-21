import type { ReactNode } from "react";
import { CheckButton } from "../../components/CheckButton";
import { TagLabel } from "../../components/TagLabel";
import { fmtRange } from "../../lib/time";
import type { Tag, Todo } from "../../lib/types";

interface TodoItemProps {
  todo: Todo;
  tag: Tag | undefined;
  use24h: boolean;
  current: boolean;
  onToggle: () => void;
  /** Extra buttons shown before the checkbox (e.g. edit / delete). */
  actions?: ReactNode;
}

export function TodoItem({ todo, tag, use24h, current, onToggle, actions }: TodoItemProps) {
  const classes = ["todo", todo.done ? "done" : "", current && !todo.done ? "current" : ""].join(" ");

  return (
    <li className={classes}>
      <div className="todo-main">
        <span className="todo-title">{todo.title}</span>
        {todo.kind === "custom" ? <span className="badge temp">Temp</span> : null}
      </div>
      <TagLabel tag={tag} />
      <span className="time">{fmtRange(todo.startTime, todo.endTime, use24h)}</span>
      {actions ? <span className="actions">{actions}</span> : null}
      <CheckButton checked={todo.done} onToggle={onToggle} />
    </li>
  );
}
