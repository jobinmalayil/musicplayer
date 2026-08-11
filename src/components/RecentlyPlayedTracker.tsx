import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useRecentlyPlayed } from '../context/RecentlyPlayedContext';

/** Always-mounted, renders nothing — just records plays as they happen. */
export function RecentlyPlayedTracker() {
  const { currentTrack } = usePlayer();
  const { recordPlay } = useRecentlyPlayed();

  useEffect(() => {
    if (currentTrack) recordPlay(currentTrack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  return null;
}
