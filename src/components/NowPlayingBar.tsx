import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { trackTitle } from '../lib/drive';
import { formatTime } from '../lib/formatTime';
import { QueueView } from './QueueView';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M6 6h2v12H6zM20 6v12l-10-6z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M16 6h2v12h-2zM4 6v12l10-6z" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M16 3h5v5h-2V6.4l-4.5 4.5-1.4-1.4L17.6 5H16zM4 5h4.5l9 14H21v2h-5.5l-9-14H4zm9.6 11.1 1.4-1.4L17.6 17H16v2h5v-5h-2v1.6z" />
    </svg>
  );
}
function RepeatIcon({ mode }: { mode: 'off' | 'all' | 'one' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z" />
      {mode === 'one' && <text x="12" y="15" fontSize="8" textAnchor="middle">1</text>}
    </svg>
  );
}

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
    seek,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  return (
    <>
      {expanded && <QueueView onClose={() => setExpanded(false)} />}
      <div className="now-playing-bar">
        <div className="progress-row">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
        <div className="controls-row">
          <button className="track-info" onClick={() => setExpanded(true)}>
            <span className="track-title">{isLoading ? 'Loading…' : trackTitle(currentTrack)}</span>
          </button>
          <div className="transport">
            <button className={`icon-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} aria-label="Shuffle">
              <ShuffleIcon />
            </button>
            <button className="icon-btn" onClick={playPrevious} aria-label="Previous">
              <PrevIcon />
            </button>
            <button className="icon-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button className="icon-btn" onClick={playNext} aria-label="Next">
              <NextIcon />
            </button>
            <button
              className={`icon-btn ${repeat !== 'off' ? 'active' : ''}`}
              onClick={cycleRepeat}
              aria-label="Repeat"
            >
              <RepeatIcon mode={repeat} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
