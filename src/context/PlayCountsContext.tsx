import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPlayCounts, recordPlay as apiRecordPlay } from '../lib/drive';

interface PlayCountsContextValue {
  getCount: (trackId: string) => number;
  recordPlay: (trackId: string) => void;
}

const PlayCountsContext = createContext<PlayCountsContextValue | null>(null);

export function PlayCountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getPlayCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  const getCount = useCallback((trackId: string) => counts[trackId] ?? 0, [counts]);

  const recordPlay = useCallback((trackId: string) => {
    setCounts((prev) => ({ ...prev, [trackId]: (prev[trackId] ?? 0) + 1 }));
    void apiRecordPlay(trackId).catch(() => {});
  }, []);

  const value = useMemo(() => ({ getCount, recordPlay }), [getCount, recordPlay]);

  return <PlayCountsContext.Provider value={value}>{children}</PlayCountsContext.Provider>;
}

export function usePlayCounts(): PlayCountsContextValue {
  const ctx = useContext(PlayCountsContext);
  if (!ctx) throw new Error('usePlayCounts must be used within PlayCountsProvider');
  return ctx;
}
