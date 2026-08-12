import { useEffect, useState } from 'react';
import { useMetadataOverrides } from '../context/MetadataOverridesContext';
import { getTrackMetadata, type TrackMetadata } from '../lib/metadata';
import type { Track } from '../lib/drive';

export function useTrackMetadata(track: Track | null): TrackMetadata {
  const [meta, setMeta] = useState<TrackMetadata>({});
  const trackId = track?.id ?? '';
  const { getOverride } = useMetadataOverrides();
  const override = track ? getOverride(track.id) : undefined;

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

  if (!override) return meta;
  return {
    ...meta,
    title: override.title || meta.title,
    artist: override.artist || meta.artist,
    album: override.album || meta.album,
  };
}
