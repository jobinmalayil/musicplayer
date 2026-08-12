import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getServerPlaylists, saveServerPlaylists } from '../lib/userData';
import type { Track } from '../lib/drive';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

interface PlaylistsContextValue {
  playlists: Playlist[];
  loading: boolean;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrack: (playlistId: string, track: Track) => void;
  removeTrack: (playlistId: string, trackId: string) => void;
}

const PlaylistsContext = createContext<PlaylistsContextValue | null>(null);

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServerPlaylists()
      .then(({ playlists }) => setPlaylists(playlists))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Every mutation goes through the functional setState form so chained
  // calls in the same handler (e.g. createPlaylist then addTrack) always
  // operate on the latest state instead of a stale render's closure.
  const persist = useCallback((updater: (prev: Playlist[]) => Playlist[]) => {
    setPlaylists((prev) => {
      const next = updater(prev);
      void saveServerPlaylists(next).catch(() => {});
      return next;
    });
  }, []);

  const createPlaylist = useCallback(
    (name: string): Playlist => {
      const playlist: Playlist = { id: crypto.randomUUID(), name, tracks: [], createdAt: Date.now() };
      persist((prev) => [...prev, playlist]);
      return playlist;
    },
    [persist],
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((p) => p.id !== id));
    },
    [persist],
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) => {
      persist((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [persist],
  );

  const addTrack = useCallback(
    (playlistId: string, track: Track) => {
      persist((prev) =>
        prev.map((p) =>
          p.id === playlistId && !p.tracks.some((t) => t.id === track.id)
            ? { ...p, tracks: [...p.tracks, track] }
            : p,
        ),
      );
    },
    [persist],
  );

  const removeTrack = useCallback(
    (playlistId: string, trackId: string) => {
      persist((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p)),
      );
    },
    [persist],
  );

  const value = useMemo(
    () => ({ playlists, loading, createPlaylist, deletePlaylist, renamePlaylist, addTrack, removeTrack }),
    [playlists, loading, createPlaylist, deletePlaylist, renamePlaylist, addTrack, removeTrack],
  );

  return <PlaylistsContext.Provider value={value}>{children}</PlaylistsContext.Provider>;
}

export function usePlaylists(): PlaylistsContextValue {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) throw new Error('usePlaylists must be used within PlaylistsProvider');
  return ctx;
}
