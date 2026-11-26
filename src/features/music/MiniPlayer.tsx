import { PauseIcon, PlayIcon, SkipIcon, SpotifyIcon, YouTubeIcon } from "../../components/Icons";
import { MiniVolume } from "./MiniVolume";
import type { MusicController } from "./useMusic";

/** Bottom-right controls: pause/play and skip, nothing else. */
export function MiniPlayer({ music }: { music: MusicController }) {
  const { source, playing, error, volume, setVolume, togglePlaying, skip } = music;
  if (!source) return null;

  const label = source === "spotify" ? "Spotify" : "YouTube";
  return (
    <div className={`mini-player ${source}`} role="region" aria-label={`${label} player`}>
      <span className="mini-source">
        {source === "spotify" ? <SpotifyIcon /> : <YouTubeIcon />}
        {label}
      </span>
      <button
        className="icon big"
        title={playing ? "Pause" : "Play"}
        aria-label={playing ? "Pause" : "Play"}
        onClick={togglePlaying}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="icon big" title="Skip" aria-label="Skip" onClick={skip}>
        <SkipIcon />
      </button>
      <MiniVolume value={volume} onCommit={setVolume} />
      {error ? <span className="mini-error small">{error}</span> : null}
    </div>
  );
}
