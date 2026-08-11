import type { IncomingMessage, ServerResponse } from 'node:http';
import { getServiceAccountToken } from './_driveAuth.js';
import { createShareToken, isAuthenticated, verifyShareToken } from './_session.js';

const API_BASE = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const LIST_FIELDS = 'nextPageToken, files(id, name, mimeType, parents, iconLink, size, modifiedTime)';

// Vercel's response-size limits make returning a whole multi-minute audio file
// in one function invocation risky, so every stream response is capped to a
// chunk the player will happily re-request more of via Range headers.
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

async function driveFetch(path: string, params: Record<string, string> = {}): Promise<Response> {
  const token = await getServiceAccountToken();
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

async function driveJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const res = await driveFetch(path, params);
  if (!res.ok) throw new Error(`Drive API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function listFolder(folderId: string) {
  const q = `'${folderId}' in parents and trashed = false and (mimeType = '${FOLDER_MIME}' or mimeType contains 'audio/')`;
  const items: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const data = await driveJson<{ files: DriveItem[]; nextPageToken?: string }>('/files', {
      q,
      fields: LIST_FIELDS,
      pageSize: '1000',
      orderBy: 'folder,name_natural',
      ...(pageToken ? { pageToken } : {}),
    });
    items.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return {
    folders: items.filter((i) => i.mimeType === FOLDER_MIME),
    tracks: items.filter((i) => i.mimeType.startsWith('audio/')),
  };
}

async function getFile(fileId: string): Promise<DriveItem> {
  return driveJson<DriveItem>(`/files/${fileId}`, { fields: 'id, name, mimeType, parents, size, modifiedTime' });
}

async function getBreadcrumb(folderId: string, rootFolderId: string): Promise<DriveItem[]> {
  const crumbs: DriveItem[] = [];
  let currentId: string | undefined = folderId;
  while (currentId && currentId !== rootFolderId) {
    const item: DriveItem = await driveJson<DriveItem>(`/files/${currentId}`, { fields: 'id, name, mimeType, parents' });
    crumbs.unshift(item);
    currentId = item.parents?.[0];
  }
  return crumbs;
}

// A service account's unscoped files.list (no parent filter) doesn't
// reliably surface content that's merely shared with it (as opposed to
// owned) — confirmed empirically: it returns zero results even for
// substrings known to match. Parent-scoped queries work fine, so search is
// built as a recursive walk from the known root folder instead of relying
// on Drive's global search for an account that owns nothing.
async function getAllTracks(folderId: string): Promise<DriveItem[]> {
  const { folders, tracks } = await listFolder(folderId);
  const nested = await Promise.all(folders.map((f) => getAllTracks(f.id)));
  return [...tracks, ...nested.flat()];
}

async function searchTracks(query: string, rootFolderId: string): Promise<DriveItem[]> {
  const needle = query.toLowerCase();
  const all = await getAllTracks(rootFolderId);
  return all.filter((t) => t.name.toLowerCase().includes(needle));
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function clampRange(rangeHeader: string | undefined): { start: number; end: number } {
  let start = 0;
  let end = MAX_CHUNK_BYTES - 1;
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader ?? '');
  if (match) {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : start + MAX_CHUNK_BYTES - 1;
  }
  if (end - start + 1 > MAX_CHUNK_BYTES) end = start + MAX_CHUNK_BYTES - 1;
  return { start, end };
}

async function streamTrack(req: IncomingMessage, res: ServerResponse, fileId: string) {
  const token = await getServiceAccountToken();
  const { start, end } = clampRange(req.headers.range);

  const upstream = await fetch(`${API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}`, Range: `bytes=${start}-${end}` },
  });

  if (!upstream.ok && upstream.status !== 206) {
    sendJson(res, upstream.status, { error: await upstream.text() });
    return;
  }

  res.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') ?? 'audio/mpeg',
    'Content-Range': upstream.headers.get('content-range') ?? '',
    'Content-Length': upstream.headers.get('content-length') ?? '',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });

  if (!upstream.body) {
    res.end();
    return;
  }
  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? 'root';

export async function handleDriveRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://internal');
  const action = url.searchParams.get('action');
  const id = url.searchParams.get('id');
  const shareToken = url.searchParams.get('t');

  // A share link's token only ever unlocks streaming/metadata for the one
  // track it was minted for — every other action still needs a real session.
  const authed = isAuthenticated(req.headers.cookie);
  const tokenGranted =
    (action === 'stream' || action === 'file') && !!id && !!shareToken && verifyShareToken(shareToken, id);

  if (!authed && !tokenGranted) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    if (action === 'share-token') {
      if (!authed) {
        sendJson(res, 403, { error: 'Sign in required' });
        return;
      }
      if (!id) {
        sendJson(res, 400, { error: 'Missing id' });
        return;
      }
      sendJson(res, 200, { token: createShareToken(id) });
      return;
    }
    if (action === 'list') {
      const folderId = url.searchParams.get('folderId') || ROOT_FOLDER_ID;
      sendJson(res, 200, await listFolder(folderId));
      return;
    }
    if (action === 'breadcrumb') {
      const folderId = url.searchParams.get('folderId') || ROOT_FOLDER_ID;
      sendJson(res, 200, await getBreadcrumb(folderId, ROOT_FOLDER_ID));
      return;
    }
    if (action === 'search') {
      const query = url.searchParams.get('q') ?? '';
      sendJson(res, 200, await searchTracks(query, ROOT_FOLDER_ID));
      return;
    }
    if (action === 'stream') {
      if (!id) {
        sendJson(res, 400, { error: 'Missing id' });
        return;
      }
      await streamTrack(req, res, id);
      return;
    }
    if (action === 'file') {
      if (!id) {
        sendJson(res, 400, { error: 'Missing id' });
        return;
      }
      sendJson(res, 200, await getFile(id));
      return;
    }
    if (action === 'root') {
      sendJson(res, 200, { rootFolderId: ROOT_FOLDER_ID });
      return;
    }
    sendJson(res, 400, { error: `Unknown action: ${action}` });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}
