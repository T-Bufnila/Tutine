import { useCallback, useMemo } from "react";
import type { AppData } from "../../hooks/useAppData";
import type { AlertFn } from "../../hooks/useAlerts";
import { useBreakTimers } from "../../hooks/useBreakTimers";
import { api } from "../../lib/api";
import type { Todo } from "../../lib/types";
import { findBreakAfter } from "./todoUtils";

type Deps = Pick<AppData, "today" | "run" | "reloadToday"> & { alert: AlertFn };

/** Actions for today's list: completing todos, temp todos and break timers. */
export function useTodayActions({ today, run, reloadToday, alert }: Deps) {
  const mutate = useCallback(
    (task: () => Promise<void>) =>
      run(async () => {
        await task();
        await reloadToday();
      }),
    [run, reloadToday],
  );

  const onBreakFinished = useCallback(
    (id: number) => {
      mutate(() => api.toggleTodo(id, true));
      alert("Break over", "Time to get back to it.");
    },
    [mutate, alert],
  );

  const { timers, start, pause, clear } = useBreakTimers(onBreakFinished);
  const todos = today?.todos;

  const actions = useMemo(
    () => ({
      toggle: (todo: Todo) => {
        if (todo.kind === "break") {
          clear(todo.id);
        } else if (todo.done && todos) {
          // Unchecking re-locks the following break, so drop its timer too.
          const next = findBreakAfter(todos, todo);
          if (next) clear(next.id);
        }
        return mutate(() => api.toggleTodo(todo.id, !todo.done));
      },

      addTemp: (title: string, start: string, end: string) => mutate(() => api.addCustomTodo(title, start, end)),
      editTemp: (id: number, title: string, start: string, end: string) =>
        mutate(() => api.updateCustomTodo(id, title, start, end)),
      deleteTemp: (id: number) => mutate(() => api.deleteCustomTodo(id)),

      startBreak: (todo: Todo) => start(todo.id, todo.breakMinutes),
      pauseBreak: (todo: Todo) => pause(todo.id),
      skipBreak: (todo: Todo) => {
        clear(todo.id);
        return mutate(() => api.toggleTodo(todo.id, true));
      },
    }),
    [start, pause, clear, mutate, todos],
  );

  return { timers, ...actions };
}

export type TodayActions = ReturnType<typeof useTodayActions>;
