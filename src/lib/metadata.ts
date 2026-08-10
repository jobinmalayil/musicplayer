import { parseBuffer, selectCover } from 'music-metadata';
import { getTrackStreamUrl } from './drive';

export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
}

// ID3v2/MP4 tags (including embedded cover art) live at the front of the
// file, so a partial range fetch is enough — no need to download whole songs
// just to read metadata.
const PARTIAL_FETCH_BYTES = 512 * 1024;

const cache = new Map<string, Promise<TrackMetadata>>();

export function getTrackMetadata(trackId: string, mimeType: string): Promise<TrackMetadata> {
  if (!trackId) return Promise.resolve({});
  const cached = cache.get(trackId);
  if (cached) return cached;

  const promise = (async (): Promise<TrackMetadata> => {
    try {
      const res = await fetch(getTrackStreamUrl(trackId), {
        headers: { Range: `bytes=0-${PARTIAL_FETCH_BYTES - 1}` },
      });
      const buffer = new Uint8Array(await res.arrayBuffer());
      const contentRange = res.headers.get('content-range'); // "bytes 0-524287/4028151"
      const totalSize = contentRange ? Number(contentRange.split('/')[1]) || undefined : undefined;

      const meta = await parseBuffer(buffer, { mimeType, size: totalSize });
      const cover = selectCover(meta.common.picture);

      // For a CBR file parsed from a truncated buffer, music-metadata can
      // report the duration of just the sampled data rather than the whole
      // file (no VBR header to extrapolate from) — bitrate is constant
      // throughout a CBR file, so recomputing from the real total size is
      // more reliable. VBR files extrapolate correctly via their Xing/VBRI
      // header even from partial data, so leave those as-is: their sampled
      // bitrate isn't representative of the whole file's average.
      const duration =
        meta.format.codecProfile === 'CBR' && totalSize && meta.format.bitrate
          ? (totalSize * 8) / meta.format.bitrate
          : meta.format.duration;

      return {
        title: meta.common.title,
        artist: meta.common.artist,
        album: meta.common.album,
        duration,
        coverUrl: cover
          ? URL.createObjectURL(new Blob([Uint8Array.from(cover.data)], { type: cover.format }))
          : undefined,
      };
    } catch {
      return {};
    }
  })();

  cache.set(trackId, promise);
  return promise;
}
