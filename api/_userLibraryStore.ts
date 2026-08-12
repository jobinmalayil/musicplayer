import { redis } from './_redis.js';

export interface StoredTrack {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  iconLink?: string;
  size?: string;
  modifiedTime?: string;
  hidden?: boolean;
}

export interface StoredPlaylist {
  id: string;
  name: string;
  tracks: StoredTrack[];
  createdAt: number;
}

const MAX_RECENT = 20;

function playlistsKey(username: string): string {
  return `musically:playlists:${username}`;
}

function recentKey(username: string): string {
  return `musically:recent:${username}`;
}

export async function getPlaylists(username: string): Promise<StoredPlaylist[]> {
  return (await redis().get<StoredPlaylist[]>(playlistsKey(username))) ?? [];
}

export async function savePlaylists(username: string, playlists: StoredPlaylist[]): Promise<void> {
  await redis().set(playlistsKey(username), playlists);
}

export async function getRecentTracks(username: string): Promise<StoredTrack[]> {
  return (await redis().get<StoredTrack[]>(recentKey(username))) ?? [];
}

export async function recordRecentTrack(username: string, track: StoredTrack): Promise<StoredTrack[]> {
  const current = await getRecentTracks(username);
  const next = [track, ...current.filter((t) => t.id !== track.id)].slice(0, MAX_RECENT);
  await redis().set(recentKey(username), next);
  return next;
}
