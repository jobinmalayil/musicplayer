import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getServerRecent, recordServerRecent } from '../lib/userData';
import type { Track } from '../lib/drive';

interface RecentlyPlayedContextValue {
  recentlyPlayed: Track[];
  recordPlay: (track: Track) => void;
}

const RecentlyPlayedContext = createContext<RecentlyPlayedContextValue | null>(null);

export function RecentlyPlayedProvider({ children }: { children: ReactNode }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  useEffect(() => {
    getServerRecent()
      .then(({ recentlyPlayed }) => setRecentlyPlayed(recentlyPlayed))
      .catch(() => {});
  }, []);

  const recordPlay = useCallback((track: Track) => {
    // Optimistic — mirrors the server's own prepend-and-dedupe-and-cap logic
    // so the UI updates instantly instead of waiting on the round trip.
    setRecentlyPlayed((prev) => [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 20));
    void recordServerRecent(track).catch(() => {});
  }, []);

  const value = useMemo(() => ({ recentlyPlayed, recordPlay }), [recentlyPlayed, recordPlay]);

  return <RecentlyPlayedContext.Provider value={value}>{children}</RecentlyPlayedContext.Provider>;
}

export function useRecentlyPlayed(): RecentlyPlayedContextValue {
  const ctx = useContext(RecentlyPlayedContext);
  if (!ctx) throw new Error('useRecentlyPlayed must be used within RecentlyPlayedProvider');
  return ctx;
}
