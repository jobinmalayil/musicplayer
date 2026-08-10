import type { IncomingMessage, ServerResponse } from 'node:http';
import { getServiceAccountToken } from './_driveAuth.ts';

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

// Not scoped to a specific folder: the service account only ever sees files
// that have actually been shared with it, so results are implicitly limited
// to that set regardless of the query.
async function searchTracks(query: string) {
  const escaped = query.replace(/'/g, "\\'");
  const q = `trashed = false and mimeType contains 'audio/' and name contains '${escaped}'`;
  const items: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const data = await driveJson<{ files: DriveItem[]; nextPageToken?: string }>('/files', {
      q,
      fields: LIST_FIELDS,
      pageSize: '100',
      ...(pageToken ? { pageToken } : {}),
    });
    items.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
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

  try {
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
      sendJson(res, 200, await searchTracks(query));
      return;
    }
    if (action === 'stream') {
      const id = url.searchParams.get('id');
      if (!id) {
        sendJson(res, 400, { error: 'Missing id' });
        return;
      }
      await streamTrack(req, res, id);
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
