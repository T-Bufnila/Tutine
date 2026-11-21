import { useCallback, useEffect, useMemo, useState } from "react";
import { api, DEFAULT_SETTINGS } from "../lib/api";
import type { Routine, SettingKey, Settings, Tag, TodayData } from "../lib/types";

/** Owns all data loaded from the Rust backend plus the actions that mutate it. */
export function useAppData() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [today, setToday] = useState<TodayData | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [error, setError] = useState("");

  /** Runs a backend task, surfacing any error in the banner. */
  const run = useCallback(async <T>(task: () => Promise<T>): Promise<T | undefined> => {
    try {
      setError("");
      return await task();
    } catch (e) {
      setError(String(e));
      return undefined;
    }
  }, []);

  const reloadToday = useCallback(async () => {
    setToday(await api.getToday());
  }, []);

  const reloadAll = useCallback(async () => {
    const [nextToday, nextRoutines, nextSettings, nextTags] = await Promise.all([
      api.getToday(),
      api.listRoutines(),
      api.getSettings(),
      api.listTags(),
    ]);
    setToday(nextToday);
    setRoutines(nextRoutines);
    setSettings(nextSettings);
    setTags(nextTags);
  }, []);

  useEffect(() => {
    run(reloadAll);
  }, [run, reloadAll]);

  const routineActions = useMemo(
    () => ({
      setActive: (id: number | null) =>
        run(async () => {
          await api.setActiveRoutine(id);
          await reloadAll();
        }),
      togglePin: (routine: Routine) =>
        run(async () => {
          await api.setPinned(routine.id as number, !routine.pinned);
          await reloadAll();
        }),
      remove: (id: number) =>
        run(async () => {
          await api.deleteRoutine(id);
          await reloadAll();
        }),
      save: (routine: Routine) =>
        run(async () => {
          const id = await api.saveRoutine(routine);
          await reloadAll();
          return id;
        }),
    }),
    [run, reloadAll],
  );

  const tagActions = useMemo(
    () => ({
      add: (color: string, description: string) =>
        run(async () => {
          await api.addTag(color, description);
          await reloadAll();
        }),
      update: (id: number, color: string, description: string) =>
        run(async () => {
          await api.updateTag(id, color, description);
          await reloadAll();
        }),
      remove: (id: number) =>
        run(async () => {
          await api.deleteTag(id);
          await reloadAll();
        }),
    }),
    [run, reloadAll],
  );

  const updateSetting = useCallback(
    (key: SettingKey, value: string) =>
      run(async () => {
        await api.setSetting(key, value);
        await reloadAll();
      }),
    [run, reloadAll],
  );

  return { routines, tags, today, settings, error, run, reloadToday, reloadAll, routineActions, tagActions, updateSetting };
}

export type AppData = ReturnType<typeof useAppData>;
export type RoutineActions = AppData["routineActions"];
export type TagActions = AppData["tagActions"];
