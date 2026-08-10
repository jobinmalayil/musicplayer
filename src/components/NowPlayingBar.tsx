import { type CSSProperties } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { trackTitle } from '../lib/drive';
import { TrackArt } from './TrackArt';
import { NowPlayingScreen } from './NowPlayingScreen';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from './icons';

export function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    screenOpen,
    openScreen,
    closeScreen,
  } = usePlayer();

  const meta = useTrackMetadata(currentTrack?.id ?? '', currentTrack?.mimeType ?? '');

  if (!currentTrack) return null;

  const progressPct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {screenOpen && <NowPlayingScreen onClose={closeScreen} />}
      <div className="now-playing-bar">
        <div className="mini-progress" style={{ '--progress': `${progressPct}%` } as CSSProperties} />
        <div className="controls-row">
          <button className="track-info" onClick={openScreen}>
            <TrackArt trackId={currentTrack.id} playing={isPlaying} size="sm" coverUrl={meta.coverUrl} />
            <span className="track-title">{isLoading ? 'Loading…' : meta.title || trackTitle(currentTrack)}</span>
          </button>
          <div className="transport">
            <button className="icon-btn" onClick={playPrevious} aria-label="Previous">
              <PrevIcon size={20} />
            </button>
            <button className="icon-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </button>
            <button className="icon-btn" onClick={playNext} aria-label="Next">
              <NextIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
