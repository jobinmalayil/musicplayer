import { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { getFile, recordPlay, trackTitle, type Track } from '../lib/drive';
import { formatTime } from '../lib/formatTime';
import { TrackArt } from './TrackArt';
import { WaveformProgress } from './WaveformProgress';
import { PauseIcon, PlayIcon } from './icons';

function SharedTrack({ track }: { track: Track }) {
  const { currentTrack, isPlaying, isLoading, currentTime, duration, togglePlay, playQueue, seek } = usePlayer();
  const meta = useTrackMetadata(track);
  const started = currentTrack?.id === track.id;
  const shownDuration = started ? duration : (meta.duration ?? 0);
  const shownTime = started ? currentTime : 0;

  const handlePlay = () => {
    if (started) {
      togglePlay();
    } else {
      playQueue([track], 0);
      void recordPlay(track.id).catch(() => {});
    }
  };

  return (
    <>
      <TrackArt trackId={track.id} playing={started && isPlaying} size="lg" coverUrl={meta.coverUrl} />
      <div className="np-meta">
        <h2 className="np-title">{meta.title || trackTitle(track)}</h2>
        {meta.artist && <p className="np-artist">{meta.artist}</p>}
      </div>

      <div className="np-progress share-player-progress">
        <WaveformProgress
          trackId={track.id}
          currentTime={shownTime}
          duration={shownDuration}
          onSeek={started ? seek : () => {}}
        />
        <div className="np-time-row">
          <span>{formatTime(shownTime)}</span>
          <span>{formatTime(shownDuration)}</span>
        </div>
      </div>

      <button className="icon-btn play-btn-lg" onClick={handlePlay} aria-label={started && isPlaying ? 'Pause' : 'Play'}>
        {started && isLoading ? '…' : started && isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
      </button>

      <p className="hint-text share-player-cta">
        Shared from <strong>Jobin Abraham Musically</strong>.{' '}
        <a className="btn-link" href="/">
          Sign in
        </a>{' '}
        to browse the full library.
      </p>
    </>
  );
}

export function PublicSharePlayer({ trackId }: { trackId: string }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFile(trackId)
      .then((t) => {
        if (!cancelled) setTrack(t);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  return (
    <div className="login-screen">
      <div className="login-card share-player-card">
        {error && <p className="login-error">This link is invalid or has expired.</p>}
        {!error && !track && <p className="hint-text">Loading…</p>}
        {track && <SharedTrack track={track} />}
      </div>
    </div>
  );
}
