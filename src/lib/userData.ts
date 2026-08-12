import type { Track } from './drive';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

async function apiFetch<T>(action: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/userdata?action=${action}`, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  return data;
}

export function getServerPlaylists(): Promise<{ playlists: Playlist[] }> {
  return apiFetch('playlists');
}

export function saveServerPlaylists(playlists: Playlist[]): Promise<{ playlists: Playlist[] }> {
  return apiFetch('save-playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playlists }),
  });
}

export function getServerRecent(): Promise<{ recentlyPlayed: Track[] }> {
  return apiFetch('recent');
}

export function recordServerRecent(track: Track): Promise<{ recentlyPlayed: Track[] }> {
  return apiFetch('record-recent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track }),
  });
}
