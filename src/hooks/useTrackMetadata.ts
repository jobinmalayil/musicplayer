import { useEffect, useState } from 'react';
import { getTrackMetadata, type TrackMetadata } from '../lib/metadata';
import type { Track } from '../lib/drive';

export function useTrackMetadata(track: Track | null): TrackMetadata {
  const [meta, setMeta] = useState<TrackMetadata>({});
  const trackId = track?.id ?? '';

  useEffect(() => {
    if (!track) {
      setMeta({});
      return;
    }
    let cancelled = false;
    setMeta({});
    getTrackMetadata(track).then((result) => {
      if (!cancelled) setMeta(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  return meta;
}
