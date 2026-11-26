import { useEffect, useState } from "react";
import { Modal, ModalActions } from "../../components/Modal";
import * as spotify from "../../lib/spotify";
import type { SpotifyPlaylist, SpotifyProfile } from "../../lib/spotify";

type Phase =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "connecting" }
  | { kind: "notPremium"; profile: SpotifyProfile }
  | { kind: "playlists"; profile: SpotifyProfile; playlists: SpotifyPlaylist[] };

interface SpotifyModalProps {
  onClose: () => void;
  onStarted: (volume: number | null) => void;
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function SpotifyModal({ onClose, onStarted }: SpotifyModalProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [clientId, setClientId] = useState(spotify.getClientId());
  const [busyUri, setBusyUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    if (!spotify.isSignedIn()) return setPhase({ kind: "signedOut" });
    setPhase({ kind: "loading" });
    try {
      const profile = await spotify.getProfile();
      if (!profile.premium) return setPhase({ kind: "notPremium", profile });
      setPhase({ kind: "playlists", profile, playlists: await spotify.listPlaylists() });
    } catch (e) {
      setError(messageOf(e));
      setPhase({ kind: "signedOut" });
    }
  };

  useEffect(() => {
    void load();
    return () => void spotify.cancelSignIn();
  }, []);

  const connect = async () => {
    setError(null);
    setPhase({ kind: "connecting" });
    try {
      await spotify.signIn(clientId.trim());
      await load();
    } catch (e) {
      setError(messageOf(e));
      setPhase({ kind: "signedOut" });
    }
  };

  const disconnect = () => {
    spotify.signOut();
    setError(null);
    setPhase({ kind: "signedOut" });
  };

  const play = async (playlist: SpotifyPlaylist) => {
    setError(null);
    setBusyUri(playlist.uri);
    try {
      onStarted(await spotify.playPlaylist(playlist.uri));
    } catch (e) {
      setError(messageOf(e));
      setBusyUri(null);
    }
  };

  const body = () => {
    switch (phase.kind) {
      case "loading":
        return <p className="muted">Loading…</p>;

      case "connecting":
        return <p className="muted">Finish signing in to Spotify in your browser…</p>;

      case "signedOut":
        return (
          <>
            <p className="muted small">
              Spotify Premium is required. Create an app at developer.spotify.com, add this redirect URI, and paste its
              Client ID:
            </p>
            <p className="small music-uri">{spotify.SPOTIFY_REDIRECT_URI}</p>
            <input
              className="music-client-id"
              placeholder="Spotify Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              spellCheck={false}
            />
            <ModalActions>
              <button className="btn ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn primary" disabled={!clientId.trim()} onClick={connect}>
                Connect Spotify
              </button>
            </ModalActions>
          </>
        );

      case "notPremium":
        return (
          <>
            <p>
              {phase.profile.displayName ? `${phase.profile.displayName}'s` : "This"} Spotify account is not Premium.
              Playback control is only available to Premium users.
            </p>
            <ModalActions>
              <button className="btn ghost" onClick={disconnect}>
                Disconnect
              </button>
              <button className="btn ghost" onClick={onClose}>
                Close
              </button>
            </ModalActions>
          </>
        );

      case "playlists":
        return (
          <>
            <p className="muted small">Pick a playlist. It plays on your open Spotify app.</p>
            <div className="music-playlists">
              {phase.playlists.length === 0 ? <p className="muted small pad">No playlists found.</p> : null}
              {phase.playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  className="music-playlist"
                  disabled={busyUri !== null}
                  onClick={() => play(playlist)}
                >
                  {playlist.name || "Untitled playlist"}
                  {busyUri === playlist.uri ? " …" : ""}
                </button>
              ))}
            </div>
            <ModalActions>
              <button className="btn ghost" onClick={disconnect}>
                Disconnect
              </button>
              <button className="btn ghost" onClick={onClose}>
                Close
              </button>
            </ModalActions>
          </>
        );
    }
  };

  return (
    <Modal title="Spotify" onClose={onClose}>
      {body()}
      {error ? <p className="error">{error}</p> : null}
    </Modal>
  );
}
