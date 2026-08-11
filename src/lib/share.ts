import { trackTitle, type Track } from './drive';

export function buildTrackShareUrl(track: Track): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('track', track.id);
  return url.toString();
}

export type ShareResult = 'shared' | 'copied' | 'failed';

/** Opens the native share sheet when available, otherwise copies the link to the clipboard. */
export async function shareTrack(track: Track): Promise<ShareResult> {
  const url = buildTrackShareUrl(track);
  const title = trackTitle(track);

  if (navigator.share) {
    try {
      await navigator.share({ title, text: `Listen to "${title}"`, url });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'failed';
      // fall through to the clipboard for any other failure (e.g. share target unavailable)
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
