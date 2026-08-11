import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { getFile } from '../lib/drive';

/** Always-mounted, renders nothing — resolves a `?track=<id>` share link into playback. */
export function SharedTrackHandler() {
  const { playQueue, openScreen } = usePlayer();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (!trackId) return;

    window.history.replaceState({}, '', window.location.pathname);
    getFile(trackId)
      .then((track) => {
        playQueue([track], 0);
        openScreen();
      })
      .catch(() => {});
    // Deliberately run once on mount only — the query param is stripped immediately after reading it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
