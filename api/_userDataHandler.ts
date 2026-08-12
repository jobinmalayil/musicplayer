import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBody, sendJson } from './_http.js';
import { getSession } from './_session.js';
import {
  getPlaylists,
  getRecentTracks,
  recordRecentTrack,
  savePlaylists,
  type StoredPlaylist,
  type StoredTrack,
} from './_userLibraryStore.js';

export async function handleUserDataRequest(req: IncomingMessage, res: ServerResponse) {
  const session = getSession(req.headers.cookie);
  if (!session) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  const { username } = session;

  const url = new URL(req.url ?? '/', 'http://internal');
  const action = url.searchParams.get('action');

  try {
    if (action === 'playlists') {
      sendJson(res, 200, { playlists: await getPlaylists(username) });
      return;
    }
    if (action === 'save-playlists') {
      const body = JSON.parse(await readBody(req)) as { playlists?: StoredPlaylist[] };
      const playlists = body.playlists ?? [];
      await savePlaylists(username, playlists);
      sendJson(res, 200, { playlists });
      return;
    }
    if (action === 'recent') {
      sendJson(res, 200, { recentlyPlayed: await getRecentTracks(username) });
      return;
    }
    if (action === 'record-recent') {
      const body = JSON.parse(await readBody(req)) as { track?: StoredTrack };
      if (!body.track?.id) {
        sendJson(res, 400, { error: 'Missing track' });
        return;
      }
      sendJson(res, 200, { recentlyPlayed: await recordRecentTrack(username, body.track) });
      return;
    }
    sendJson(res, 400, { error: `Unknown action: ${action}` });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}
