import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { usePlayCounts } from '../context/PlayCountsContext';

/** Always-mounted, renders nothing — bumps the play count once per track selected. */
export function PlayCountTracker() {
  const { currentTrack } = usePlayer();
  const { recordPlay } = usePlayCounts();

  useEffect(() => {
    if (currentTrack) recordPlay(currentTrack.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  return null;
}
