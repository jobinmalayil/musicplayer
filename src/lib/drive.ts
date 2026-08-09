import { getAccessToken } from './googleAuth';

const API_BASE = 'https://www.googleapis.com/drive/v3';

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

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Drive doesn't expose ID3 tags, so we derive a clean display title from the filename. */
export function trackTitle(track: Track): string {
  return track.name.replace(/\.[a-z0-9]+$/i, '');
}

async function driveFetch(path: string, params: Record<string, string> = {}): Promise<Response> {
  const token = await getAccessToken();
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API ${path} failed: ${res.status} ${body}`);
  }
  return res;
}

const LIST_FIELDS = 'nextPageToken, files(id, name, mimeType, parents, iconLink, size, modifiedTime)';

/** Lists folders and audio files inside a given folder ('root' for the top level). */
export async function listFolder(folderId = 'root'): Promise<{ folders: DriveItem[]; tracks: Track[] }> {
  const q = `'${folderId}' in parents and trashed = false and (mimeType = '${FOLDER_MIME}' or mimeType contains 'audio/')`;
  const items: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const res = await driveFetch('/files', {
      q,
      fields: LIST_FIELDS,
      pageSize: '1000',
      orderBy: 'folder,name_natural',
      ...(pageToken ? { pageToken } : {}),
    });
    const data = (await res.json()) as { files: DriveItem[]; nextPageToken?: string };
    items.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return {
    folders: items.filter((i) => i.mimeType === FOLDER_MIME),
    tracks: items.filter((i) => i.mimeType.startsWith('audio/')),
  };
}

/** Recursively searches the whole Drive for audio files matching a name query. */
export async function searchTracks(query: string): Promise<Track[]> {
  const escaped = query.replace(/'/g, "\\'");
  const q = `trashed = false and mimeType contains 'audio/' and name contains '${escaped}'`;
  const items: Track[] = [];
  let pageToken: string | undefined;
  do {
    const res = await driveFetch('/files', {
      q,
      fields: LIST_FIELDS,
      pageSize: '100',
      ...(pageToken ? { pageToken } : {}),
    });
    const data = (await res.json()) as { files: Track[]; nextPageToken?: string };
    items.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

/** Returns the display path (breadcrumb) from root to the given folder, root-first. */
export async function getBreadcrumb(folderId: string): Promise<DriveItem[]> {
  const crumbs: DriveItem[] = [];
  let currentId: string | undefined = folderId;
  while (currentId && currentId !== 'root') {
    const res = await driveFetch(`/files/${currentId}`, { fields: 'id, name, mimeType, parents' });
    const item = (await res.json()) as DriveItem;
    crumbs.unshift(item);
    currentId = item.parents?.[0];
  }
  return crumbs;
}

const objectUrlCache = new Map<string, string>();

/** Downloads a track's audio content and returns a blob: URL suitable for an <audio> element. */
export async function getTrackStreamUrl(trackId: string): Promise<string> {
  const cached = objectUrlCache.get(trackId);
  if (cached) return cached;

  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/files/${trackId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch audio ${trackId}: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(trackId, url);
  return url;
}

export function releaseTrackStreamUrl(trackId: string) {
  const url = objectUrlCache.get(trackId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(trackId);
  }
}
