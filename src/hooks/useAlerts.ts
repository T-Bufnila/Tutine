import { useCallback, useEffect, useRef } from "react";
import { ensureNotificationPermission, notify } from "../lib/notify";
import { playSound } from "../lib/sound";
import { fmtRange, nowMinutes, toMinutes } from "../lib/time";
import type { Settings, TodayData } from "../lib/types";
import { useLatest } from "./useLatest";

const CHECK_INTERVAL_MS = 15_000;

export type AlertFn = (title: string, body: string) => void;

/** Fires a system notification and/or sound according to the current settings. */
export function useAlert(settings: Settings): AlertFn {
  const settingsRef = useLatest(settings);

  return useCallback<AlertFn>(
    (title, body) => {
      const { notifications, soundEnabled, soundId } = settingsRef.current;
      if (notifications) notify(title, body);
      if (soundEnabled) playSound(soundId);
    },
    [settingsRef],
  );
}

/** Raises an alert when a todo's start time is reached. */
export function useDueAlerts(today: TodayData | null, settings: Settings, alert: AlertFn) {
  const alerted = useRef(new Set<string>());
  const todayRef = useLatest(today);
  const use24hRef = useLatest(settings.use24h);
  const active = settings.notifications || settings.soundEnabled;

  useEffect(() => {
    if (settings.notifications) ensureNotificationPermission();
  }, [settings.notifications]);

  useEffect(() => {
    if (!active) return;

    const check = () => {
      const data = todayRef.current;
      if (!data) return;
      const now = nowMinutes(new Date());

      for (const todo of data.todos) {
        if (todo.kind === "break" || todo.done || !todo.startTime) continue;
        if (toMinutes(todo.startTime) !== now) continue;
        const key = `${data.date}:${todo.id}`;
        if (alerted.current.has(key)) continue;
        alerted.current.add(key);
        alert(todo.title, fmtRange(todo.startTime, todo.endTime, use24hRef.current));
      }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, alert, todayRef, use24hRef]);
}
