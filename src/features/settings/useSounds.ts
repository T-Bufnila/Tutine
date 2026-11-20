import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { forgetCustomSound } from "../../lib/sound";
import type { Sound } from "../../lib/types";

/** Loads uploaded sounds and wraps the add / rename / delete actions. */
export function useSounds() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setSounds(await api.listSounds());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const guard = async <T>(task: () => Promise<T>): Promise<T | undefined> => {
    try {
      setError("");
      const result = await task();
      await reload();
      return result;
    } catch (e) {
      setError(String(e));
      return undefined;
    }
  };

  return {
    sounds,
    error,
    setError,
    add: (name: string, file: File) => guard(async () => api.addSound(name, await file.arrayBuffer())),
    rename: (id: number, name: string) => guard(() => api.renameSound(id, name)),
    remove: (id: number) =>
      guard(async () => {
        await api.deleteSound(id);
        forgetCustomSound(id);
      }),
  };
}
