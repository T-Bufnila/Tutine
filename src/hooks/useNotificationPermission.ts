import { useCallback, useEffect, useState } from "react";
import { ensureNotificationPermission, isNotificationAllowed } from "../lib/notify";

/** `null` while the permission is still being checked. */
export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    isNotificationAllowed().then(setGranted);
  }, []);

  const request = useCallback(async () => setGranted(await ensureNotificationPermission()), []);

  return { granted, request };
}
