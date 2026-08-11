import { getShareToken, trackTitle, type Track } from './drive';

export function buildTrackShareUrl(track: Track, token?: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('track', track.id);
  if (token) url.searchParams.set('t', token);
  return url.toString();
}

export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * Mints a link that plays this one track for anyone who opens it — no
 * sign-in required — then opens the native share sheet when available,
 * otherwise copies the link to the clipboard.
 */
export async function shareTrack(track: Track): Promise<ShareResult> {
  let token: string | undefined;
  try {
    ({ token } = await getShareToken(track.id));
  } catch {
    // Minting failed (e.g. offline) — still offer a link, just one that
    // requires the recipient to sign in rather than playing instantly.
  }

  const url = buildTrackShareUrl(track, token);
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
