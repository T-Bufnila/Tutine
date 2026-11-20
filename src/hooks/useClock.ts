import { useEffect, useState } from "react";
import { useLatest } from "./useLatest";

/** Current time, refreshed on an interval; `onTick` runs on every refresh. */
export function useClock(onTick: () => void, intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  const onTickRef = useLatest(onTick);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      onTickRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, onTickRef]);

  return now;
}
