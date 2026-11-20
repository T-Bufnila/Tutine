import { useCallback, useEffect, useRef, useState } from "react";
import { useLatest } from "./useLatest";

export interface BreakTimerState {
  remaining: number;
  running: boolean;
}

type TimerMap = Record<number, BreakTimerState>;

/** Countdown timers keyed by break todo id. `onFinish` fires when one hits zero. */
export function useBreakTimers(onFinish: (id: number) => void) {
  const [timers, setTimers] = useState<TimerMap>({});
  const timersRef = useRef(timers);
  const onFinishRef = useLatest(onFinish);

  const commit = useCallback((next: TimerMap) => {
    timersRef.current = next;
    setTimers(next);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const current = timersRef.current;
      const next: TimerMap = { ...current };
      const finished: number[] = [];
      let changed = false;

      for (const [key, timer] of Object.entries(current)) {
        if (!timer.running) continue;
        changed = true;
        const todoId = Number(key);
        if (timer.remaining <= 1) {
          delete next[todoId];
          finished.push(todoId);
        } else {
          next[todoId] = { ...timer, remaining: timer.remaining - 1 };
        }
      }

      if (changed) commit(next);
      finished.forEach((todoId) => onFinishRef.current(todoId));
    }, 1000);
    return () => clearInterval(id);
  }, [commit, onFinishRef]);

  const start = useCallback(
    (id: number, minutes: number) => {
      const remaining = timersRef.current[id]?.remaining ?? minutes * 60;
      commit({ ...timersRef.current, [id]: { remaining, running: true } });
    },
    [commit],
  );

  const pause = useCallback(
    (id: number) => {
      const timer = timersRef.current[id];
      if (timer) commit({ ...timersRef.current, [id]: { ...timer, running: false } });
    },
    [commit],
  );

  const clear = useCallback(
    (id: number) => {
      if (!(id in timersRef.current)) return;
      const next = { ...timersRef.current };
      delete next[id];
      commit(next);
    },
    [commit],
  );

  return { timers, start, pause, clear };
}
