import { useEffect, useState } from "react";
import { checkForUpdate, currentVersion, type AvailableUpdate } from "../lib/updates";

/** Checks once on load whether a newer release than the running version exists. */
export function useUpdateCheck() {
  const [version, setVersion] = useState<string | null>(null);
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await currentVersion();
      if (cancelled) return;
      setVersion(current);
      const available = await checkForUpdate(current);
      if (!cancelled) setUpdate(available);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { version, update };
}
