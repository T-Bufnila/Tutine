import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";

const LATEST_RELEASE_API = "https://api.github.com/repos/T-Bufnila/Tutine/releases/latest";

export interface AvailableUpdate {
  version: string;
  url: string;
}

function parseVersion(tag: string): number[] {
  return tag
    .replace(/^v/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export const currentVersion = () => getVersion();

/** Resolves to `null` when up to date or when the check fails (offline, rate limited). */
export async function checkForUpdate(current: string): Promise<AvailableUpdate | null> {
  try {
    const res = await fetch(LATEST_RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return null;
    const release: { tag_name?: string; html_url?: string } = await res.json();
    if (!release.tag_name || !release.html_url || !isNewer(release.tag_name, current)) return null;
    return { version: release.tag_name.replace(/^v/, ""), url: release.html_url };
  } catch {
    return null;
  }
}

export const openReleasePage = (url: string) => invoke<void>("open_release_page", { url });
