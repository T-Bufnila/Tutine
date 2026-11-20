import { useCallback, useEffect, useState } from "react";
import { isAudioReady, onAudioStateChange, unlockAudio } from "../lib/sound";

/** Whether the WebView currently allows audio, plus a way to request it from a click. */
export function useAudioReady() {
  const [ready, setReady] = useState(isAudioReady);

  useEffect(() => {
    const refresh = () => setReady(isAudioReady());
    refresh();
    return onAudioStateChange(refresh);
  }, []);

  const allow = useCallback(async () => setReady(await unlockAudio()), []);

  return { ready, allow };
}
