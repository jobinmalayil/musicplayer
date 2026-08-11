import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Track } from '../lib/drive';

interface RecentlyPlayedContextValue {
  recentlyPlayed: Track[];
  recordPlay: (track: Track) => void;
}

const STORAGE_KEY = 'drive-music.recently-played';
const MAX_ENTRIES = 20;

function readStored(): Track[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch {
    return [];
  }
}

const RecentlyPlayedContext = createContext<RecentlyPlayedContextValue | null>(null);

export function RecentlyPlayedProvider({ children }: { children: ReactNode }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(readStored);

  const recordPlay = useCallback((track: Track) => {
    setRecentlyPlayed((prev) => {
      const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ recentlyPlayed, recordPlay }), [recentlyPlayed, recordPlay]);

  return <RecentlyPlayedContext.Provider value={value}>{children}</RecentlyPlayedContext.Provider>;
}

export function useRecentlyPlayed(): RecentlyPlayedContextValue {
  const ctx = useContext(RecentlyPlayedContext);
  if (!ctx) throw new Error('useRecentlyPlayed must be used within RecentlyPlayedProvider');
  return ctx;
}
