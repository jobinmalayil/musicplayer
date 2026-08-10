import { useEffect, useState } from 'react';
import { getTrackMetadata, type TrackMetadata } from '../lib/metadata';

export function useTrackMetadata(trackId: string, mimeType: string): TrackMetadata {
  const [meta, setMeta] = useState<TrackMetadata>({});

  useEffect(() => {
    let cancelled = false;
    setMeta({});
    getTrackMetadata(trackId, mimeType).then((result) => {
      if (!cancelled) setMeta(result);
    });
    return () => {
      cancelled = true;
    };
  }, [trackId, mimeType]);

  return meta;
}
