import { invoke } from "@tauri-apps/api/core";

const REDIRECT_PORT = 8898;
export const SPOTIFY_REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;

const SCOPES = [
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

const CLIENT_ID_KEY = "spotifyClientId";
const TOKEN_KEY = "spotifyToken";
const EXPIRY_MARGIN_MS = 60_000;

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface SpotifyProfile {
  displayName: string;
  premium: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
}

export class SpotifyError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}

// --- Storage ----------------------------------------------------------------

export const getClientId = () => localStorage.getItem(CLIENT_ID_KEY) ?? "";
export const setClientId = (id: string) => localStorage.setItem(CLIENT_ID_KEY, id.trim());

function readToken(): StoredToken | null {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null") as StoredToken | null;
  } catch {
    return null;
  }
}

function saveToken(res: TokenResponse, previousRefresh = "") {
  const token: StoredToken = {
    accessToken: res.access_token,
    refreshToken: res.refresh_token ?? previousRefresh,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
}

export const isSignedIn = () => readToken() !== null;
export const signOut = () => localStorage.removeItem(TOKEN_KEY);

// --- OAuth (authorization code with PKCE) ---------------------------------

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomString(length: number) {
  return base64Url(crypto.getRandomValues(new Uint8Array(length))).slice(0, length);
}

async function challengeFor(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new SpotifyError("Spotify rejected the sign-in", res.status);
  return res.json();
}

/** Opens the Spotify consent page in the browser and stores the resulting token. */
export async function signIn(clientId: string) {
  const verifier = randomString(96);
  const state = randomString(16);
  const authorizeUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SCOPES,
      state,
      code_challenge_method: "S256",
      code_challenge: await challengeFor(verifier),
    });

  const target = await invoke<string>("spotify_authorize", { url: authorizeUrl, port: REDIRECT_PORT });
  const params = new URL(target, SPOTIFY_REDIRECT_URI).searchParams;
  if (params.get("error")) throw new SpotifyError("Spotify access was not granted");
  const code = params.get("code");
  if (!code || params.get("state") !== state) throw new SpotifyError("Spotify sign-in failed, please try again");

  setClientId(clientId);
  saveToken(
    await requestToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
    }),
  );
}

export const cancelSignIn = () => invoke("spotify_cancel_authorize").catch(() => undefined);

async function accessToken() {
  const token = readToken();
  if (!token) throw new SpotifyError("Not connected to Spotify", 401);
  if (token.expiresAt - Date.now() > EXPIRY_MARGIN_MS) return token.accessToken;

  try {
    const res = await requestToken({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: getClientId(),
    });
    return saveToken(res, token.refreshToken).accessToken;
  } catch {
    signOut();
    throw new SpotifyError("Your Spotify session expired, please connect again", 401);
  }
}

// --- Web API --------------------------------------------------------------

async function api<T = undefined>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
  });
  if (res.status === 204 || res.status === 202) return undefined;
  if (res.ok) return (await res.json().catch(() => undefined)) as T | undefined;

  if (res.status === 401) signOut();
  if (res.status === 404) throw new SpotifyError("No Spotify device is available. Open Spotify and try again.", 404);
  if (res.status === 403) throw new SpotifyError("Spotify Premium is required to control playback.", 403);
  throw new SpotifyError(`Spotify request failed (${res.status})`, res.status);
}

export async function getProfile(): Promise<SpotifyProfile> {
  const me = await api<{ display_name: string | null; id: string; product: string }>("/me");
  return { displayName: me?.display_name ?? me?.id ?? "", premium: me?.product === "premium" };
}

export async function listPlaylists(): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = [];
  let path: string | null = "/me/playlists?limit=50";
  while (path) {
    const page: { items: (SpotifyPlaylist | null)[]; next: string | null } | undefined = await api(path);
    for (const item of page?.items ?? []) if (item) playlists.push(item);
    path = page?.next ? page.next.replace("https://api.spotify.com/v1", "") : null;
  }
  return playlists;
}

/** Starts the playlist on the user's active device, or the first available one. Resolves with that device's volume. */
export async function playPlaylist(uri: string): Promise<number | null> {
  const list = await api<{ devices: { id: string | null; is_active: boolean; volume_percent: number | null }[] }>(
    "/me/player/devices",
  );
  const devices = list?.devices ?? [];
  const device = devices.find((d) => d.is_active) ?? devices.find((d) => d.id);
  if (!device?.id) throw new SpotifyError("No Spotify device is available. Open Spotify and try again.", 404);

  await api(`/me/player/play?device_id=${encodeURIComponent(device.id)}`, {
    method: "PUT",
    body: JSON.stringify({ context_uri: uri }),
  });
  return device.volume_percent;
}

export const pause = () => api("/me/player/pause", { method: "PUT" });
export const resume = () => api("/me/player/play", { method: "PUT" });
export async function setVolume(percent: number) {
  try {
    await api(`/me/player/volume?volume_percent=${Math.round(percent)}`, { method: "PUT" });
  } catch (e) {
    if (e instanceof SpotifyError && e.status === 403) {
      throw new SpotifyError("This Spotify device doesn't allow volume control.", 403);
    }
    throw e;
  }
}
export const skip = () => api("/me/player/next", { method: "POST" });

export async function isPlaying(): Promise<boolean | null> {
  const state = await api<{ is_playing: boolean }>("/me/player");
  return state ? state.is_playing : null;
}
