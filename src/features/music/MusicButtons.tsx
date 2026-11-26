import { SpotifyIcon, YouTubeIcon } from "../../components/Icons";
import type { MusicController } from "./useMusic";

interface MusicButtonsProps {
  music: MusicController;
  collapsed: boolean;
}

/** Spotify (left) and YouTube (right) share one row, each taking half. */
export function MusicButtons({ music, collapsed }: MusicButtonsProps) {
  const { source, openSpotify, toggleYouTube } = music;
  return (
    <div className={`music-row ${collapsed ? "collapsed" : ""}`}>
      <button
        className={`music-btn spotify ${source === "spotify" ? "active" : ""}`}
        title="Spotify"
        aria-label="Spotify"
        onClick={openSpotify}
      >
        <SpotifyIcon />
        {collapsed ? null : "Spotify"}
      </button>
      <button
        className={`music-btn youtube ${source === "youtube" ? "active" : ""}`}
        title={source === "youtube" ? "Stop lofi" : "Play lofi on YouTube"}
        aria-label="YouTube lofi"
        aria-pressed={source === "youtube"}
        onClick={toggleYouTube}
      >
        <YouTubeIcon />
        {collapsed ? null : "YouTube"}
      </button>
    </div>
  );
}
