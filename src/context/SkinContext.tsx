import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SKIN } from '../lib/skins';

const STORAGE_KEY = 'drive-music.skin';

interface SkinContextValue {
  skin: string;
  setSkin: (id: string) => void;
}

const SkinContext = createContext<SkinContextValue | null>(null);

function readStoredSkin(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

// Mounted at the very top of the app (outside auth) so the chosen skin
// applies on the login screen too, not just once signed in. The inline
// script in index.html already stamped `data-skin` before React loaded, to
// avoid a flash of the default theme — this just keeps that in sync.
export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<string>(readStoredSkin);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin);
  }, [skin]);

  const setSkin = useCallback((id: string) => {
    setSkinState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can be unavailable (private browsing, quota) — the skin
      // still applies for this session, it just won't persist.
    }
  }, []);

  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkin(): SkinContextValue {
  const ctx = useContext(SkinContext);
  if (!ctx) throw new Error('useSkin must be used within SkinProvider');
  return ctx;
}
