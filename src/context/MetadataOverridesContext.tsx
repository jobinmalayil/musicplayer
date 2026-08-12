import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  clearMetadataOverride,
  getMetadataOverrides,
  setMetadataOverride,
  type MetadataOverride,
} from '../lib/drive';

interface MetadataOverridesContextValue {
  getOverride: (trackId: string) => MetadataOverride | undefined;
  setOverride: (trackId: string, override: MetadataOverride) => Promise<void>;
  clearOverride: (trackId: string) => Promise<void>;
}

const MetadataOverridesContext = createContext<MetadataOverridesContextValue | null>(null);

// Read-only, no-op default so useTrackMetadata (used by both the authenticated
// app and the anonymous public share player) can call this hook unconditionally
// without every caller needing to be wrapped in a provider.
const DEFAULT_VALUE: MetadataOverridesContextValue = {
  getOverride: () => undefined,
  setOverride: async () => {},
  clearOverride: async () => {},
};

export function MetadataOverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, MetadataOverride>>({});

  useEffect(() => {
    getMetadataOverrides()
      .then(setOverrides)
      .catch(() => {});
  }, []);

  const getOverride = useCallback((trackId: string) => overrides[trackId], [overrides]);

  const setOverride = useCallback(async (trackId: string, override: MetadataOverride) => {
    setOverrides((prev) => ({ ...prev, [trackId]: override }));
    await setMetadataOverride(trackId, override);
  }, []);

  const clearOverride = useCallback(async (trackId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    await clearMetadataOverride(trackId);
  }, []);

  const value = useMemo(() => ({ getOverride, setOverride, clearOverride }), [getOverride, setOverride, clearOverride]);

  return <MetadataOverridesContext.Provider value={value}>{children}</MetadataOverridesContext.Provider>;
}

export function useMetadataOverrides(): MetadataOverridesContextValue {
  const ctx = useContext(MetadataOverridesContext);
  return ctx ?? DEFAULT_VALUE;
}
