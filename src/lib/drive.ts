export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  iconLink?: string;
  size?: string;
  modifiedTime?: string;
}

export type Track = DriveItem;

/** Drive doesn't expose ID3 tags, so we derive a clean display title from the filename. */
export function trackTitle(track: Track): string {
  return track.name.replace(/\.[a-z0-9]+$/i, '');
}

/**
 * Alphabetical by display title. The folder listing already comes back
 * pre-sorted from Drive's own `orderBy`, but search results don't — sorting
 * client-side keeps ordering consistent everywhere regardless of what the
 * API happens to return.
 */
export function sortTracksByTitle(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => trackTitle(a).localeCompare(trackTitle(b), undefined, { numeric: true }));
}

// Set once, up front, for an unauthenticated visitor opening a shared-song
// link — every request in that mode carries it, which is safe because the
// server only ever honors it for that one track's `file`/`stream` actions.
let activeShareToken: string | null = null;

export function setActiveShareToken(token: string | null) {
  activeShareToken = token;
}

async function apiFetch<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL('/api/drive', window.location.origin);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (activeShareToken) url.searchParams.set('t', activeShareToken);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive proxy ${action} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

/** The shared Drive folder this app is scoped to, configured server-side. */
export async function getRootFolderId(): Promise<string> {
  const { rootFolderId } = await apiFetch<{ rootFolderId: string }>('root');
  return rootFolderId;
}

/** Lists folders and audio files inside a given folder. */
export function listFolder(folderId: string): Promise<{ folders: DriveItem[]; tracks: Track[] }> {
  return apiFetch('list', { folderId });
}

/** Returns the display path (breadcrumb) from the app's root folder down to the given folder. */
export function getBreadcrumb(folderId: string): Promise<DriveItem[]> {
  return apiFetch('breadcrumb', { folderId });
}

/** Searches everything the app's service account can see for audio files matching a name query. */
export function searchTracks(query: string): Promise<Track[]> {
  return apiFetch('search', { q: query });
}

/** Fetches a single file's metadata by id — used to resolve a shared-song deep link. */
export function getFile(id: string): Promise<Track> {
  return apiFetch('file', { id });
}

/** Mints a signed link (valid ~30 days) that lets anyone stream just this one track without signing in. */
export function getShareToken(id: string): Promise<{ token: string }> {
  return apiFetch('share-token', { id });
}

/** Streams a track's audio through our proxy — no token, no blob download, real range-request seeking. */
export function getTrackStreamUrl(trackId: string): string {
  const base = `/api/drive?action=stream&id=${encodeURIComponent(trackId)}`;
  return activeShareToken ? `${base}&t=${encodeURIComponent(activeShareToken)}` : base;
}
