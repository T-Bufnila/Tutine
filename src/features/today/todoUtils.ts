import type { Todo } from "../../lib/types";

/** The break generated right after a routine todo (it starts when the todo ends). */
export function findBreakAfter(todos: Todo[], todo: Todo): Todo | undefined {
  return todos.find((t) => t.kind === "break" && t.startTime === todo.endTime);
}

/** Ids of breaks whose preceding routine todo has been completed. */
export function unlockedBreakIds(todos: Todo[]): Set<number> {
  const finishedEnds = new Set(todos.filter((t) => t.kind === "routine" && t.done).map((t) => t.endTime));
  return new Set(todos.filter((t) => t.kind === "break" && finishedEnds.has(t.startTime)).map((t) => t.id));
}

export function summarize(todos: Todo[]) {
  let total = 0;
  let done = 0;
  let scheduled = 0;
  for (const t of todos) {
    if (t.kind !== "custom") scheduled++;
    if (t.kind === "break") continue;
    total++;
    if (t.done) done++;
  }
  return { total, done, hasSchedule: scheduled > 0 };
}
