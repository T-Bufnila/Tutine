import { useCallback, useEffect, useRef, useState } from "react";
import { useStoredState } from "../../hooks/useStoredState";
import * as spotify from "../../lib/spotify";
import { startLofi } from "../../lib/youtube";
import type { LofiPlayer } from "../../lib/youtube";

export type MusicSource = "spotify" | "youtube";

const SPOTIFY_POLL_MS = 5000;
const DEFAULT_LOFI_VOLUME = 60;
const DEFAULT_SPOTIFY_VOLUME = 50;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Owns the music state: at most one source plays at a time. */
export function useMusic() {
  const [source, setSource] = useState<MusicSource | null>(null);
  const [playing, setPlaying] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lofiVolume, setLofiVolume] = useStoredState("lofiVolume", DEFAULT_LOFI_VOLUME);
  // Spotify keeps its own volume; we only mirror the device's value.
  const [spotifyVolume, setSpotifyVolume] = useState(DEFAULT_SPOTIFY_VOLUME);

  // Hidden container the YouTube embed is mounted into.
  const hostRef = useRef<HTMLDivElement>(null);
  const lofi = useRef<LofiPlayer | null>(null);

  const stopYouTube = useCallback(() => {
    lofi.current?.destroy();
    lofi.current = null;
  }, []);

  useEffect(() => stopYouTube, [stopYouTube]);

  // Keep the play/pause button honest when Spotify is controlled elsewhere.
  useEffect(() => {
    if (source !== "spotify") return;
    const timer = setInterval(() => {
      spotify
        .isPlaying()
        .then((state) => state !== null && setPlaying(state))
        .catch(() => undefined);
    }, SPOTIFY_POLL_MS);
    return () => clearInterval(timer);
  }, [source]);

  const toggleYouTube = useCallback(() => {
    setError(null);
    if (source === "youtube") {
      stopYouTube();
      setSource(null);
      setPlaying(false);
      return;
    }
    if (source === "spotify") spotify.pause().catch(() => undefined);

    setSpotifyOpen(false);
    setSource("youtube");
    setPlaying(true);
    if (hostRef.current) {
      lofi.current = startLofi(hostRef.current, {
        volume: lofiVolume,
        onPlaying: setPlaying,
        onError: (message) => {
          setPlaying(false);
          setError(message);
        },
      });
    }
  }, [source, stopYouTube, lofiVolume]);

  const openSpotify = useCallback(() => {
    setError(null);
    if (source === "youtube") {
      stopYouTube();
      setSource(null);
      setPlaying(false);
    }
    setSpotifyOpen(true);
  }, [source, stopYouTube]);

  const closeSpotify = useCallback(() => setSpotifyOpen(false), []);

  const spotifyStarted = useCallback((deviceVolume: number | null) => {
    if (deviceVolume !== null) setSpotifyVolume(deviceVolume);
    setSource("spotify");
    setPlaying(true);
    setSpotifyOpen(false);
  }, []);

  const togglePlaying = useCallback(async () => {
    setError(null);
    try {
      if (source === "youtube") {
        if (playing) lofi.current?.pause();
        else lofi.current?.resume();
      } else if (source === "spotify") {
        await (playing ? spotify.pause() : spotify.resume());
      }
      setPlaying(!playing);
    } catch (e) {
      setError(messageOf(e));
    }
  }, [source, playing]);

  const skip = useCallback(async () => {
    setError(null);
    try {
      if (source === "youtube") lofi.current?.skip();
      else if (source === "spotify") await spotify.skip();
      setPlaying(true);
    } catch (e) {
      setError(messageOf(e));
    }
  }, [source]);

  const setVolume = useCallback(
    async (volume: number) => {
      setError(null);
      if (source === "youtube") {
        setLofiVolume(volume);
        lofi.current?.setVolume(volume);
      } else if (source === "spotify") {
        const previous = spotifyVolume;
        setSpotifyVolume(volume);
        try {
          await spotify.setVolume(volume);
        } catch (e) {
          setSpotifyVolume(previous);
          setError(messageOf(e));
        }
      }
    },
    [source, spotifyVolume, setLofiVolume],
  );

  return {
    source,
    volume: source === "spotify" ? spotifyVolume : lofiVolume,
    setVolume,
    playing,
    error,
    spotifyOpen,
    hostRef,
    toggleYouTube,
    openSpotify,
    closeSpotify,
    spotifyStarted,
    togglePlaying,
    skip,
  };
}

export type MusicController = ReturnType<typeof useMusic>;
