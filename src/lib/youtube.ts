/** Background lofi streams played through a hidden YouTube embed. */
const LOFI_VIDEOS = ["5qap5aO4i9A", "4xDzrJKXOOY", "7NOSDKb0HlU", "5yx6BWlEVcY"];

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(volume: number): void;
  loadVideoById(id: string): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      width: number;
      height: number;
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;

let apiLoad: Promise<YTNamespace> | null = null;

function loadApi() {
  apiLoad ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT as YTNamespace);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      apiLoad = null;
      reject(new Error("Could not reach YouTube"));
    };
    document.head.appendChild(script);
  });
  return apiLoad;
}

export interface LofiPlayer {
  pause(): void;
  resume(): void;
  skip(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface LofiCallbacks {
  /** 0-100. */
  volume: number;
  onPlaying: (playing: boolean) => void;
  onError: (message: string) => void;
}

/** Starts playback immediately; controls issued before the embed is ready are applied once it is. */
export function startLofi(host: HTMLElement, { volume, onPlaying, onError }: LofiCallbacks): LofiPlayer {
  let index = Math.floor(Math.random() * LOFI_VIDEOS.length);
  let player: YTPlayer | null = null;
  let ready = false;
  let destroyed = false;
  let wantPlaying = true;
  let failures = 0;

  const mount = document.createElement("div");
  host.appendChild(mount);

  const load = () => player?.loadVideoById(LOFI_VIDEOS[index]);

  loadApi()
    .then((YT) => {
      if (destroyed) return;
      player = new YT.Player(mount, {
        width: 320,
        height: 180,
        videoId: LOFI_VIDEOS[index],
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, origin: window.location.origin },
        events: {
          // The player's methods only exist once it reports ready.
          onReady: () => {
            if (destroyed) return;
            ready = true;
            player?.setVolume(volume);
            if (wantPlaying) player?.playVideo();
            else player?.pauseVideo();
          },
          onStateChange: ({ data }) => {
            if (data === YT_PLAYING) {
              failures = 0;
              onPlaying(true);
            } else if (data === YT_PAUSED) onPlaying(false);
          },
          onError: () => {
            // A stream can go offline; try the next one before giving up.
            if (++failures >= LOFI_VIDEOS.length) return onError("YouTube could not play any lofi stream.");
            index = (index + 1) % LOFI_VIDEOS.length;
            load();
          },
        },
      });
    })
    .catch((e: Error) => onError(e.message));

  return {
    pause() {
      wantPlaying = false;
      if (ready) player?.pauseVideo();
    },
    resume() {
      wantPlaying = true;
      if (ready) player?.playVideo();
    },
    setVolume(next) {
      volume = next;
      if (ready) player?.setVolume(next);
    },
    skip() {
      index = (index + 1) % LOFI_VIDEOS.length;
      wantPlaying = true;
      if (ready) load();
    },
    destroy() {
      destroyed = true;
      if (ready) player?.destroy();
      else host.replaceChildren();
    },
  };
}
