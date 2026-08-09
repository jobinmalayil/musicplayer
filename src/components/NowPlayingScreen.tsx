import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { trackTitle } from '../lib/drive';
import { formatTime } from '../lib/formatTime';
import { TrackArt } from './TrackArt';
import { ChevronDownIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon } from './icons';

export function NowPlayingScreen({ onClose }: { onClose: () => void }) {
  const {
    queue,
    currentTrack,
    isPlaying,
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
    playQueue,
  } = usePlayer();

  const [tab, setTab] = useState<'playing' | 'queue'>('playing');

  if (!currentTrack) return null;

  return (
    <div className="now-playing-screen">
      <div className="np-header">
        <button className="icon-btn" onClick={onClose} aria-label="Collapse">
          <ChevronDownIcon />
        </button>
        <div className="np-tabs">
          <button className={tab === 'playing' ? 'active' : ''} onClick={() => setTab('playing')}>
            Now Playing
          </button>
          <button className={tab === 'queue' ? 'active' : ''} onClick={() => setTab('queue')}>
            Up Next
          </button>
        </div>
        <span aria-hidden="true" />
      </div>

      {tab === 'playing' ? (
        <div className="np-body">
          <div className="np-art">
            <TrackArt trackId={currentTrack.id} playing={isPlaying} size="lg" />
          </div>
          <div className="np-meta">
            <h2 className="np-title">{trackTitle(currentTrack)}</h2>
          </div>

          <div className="np-progress">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
            />
            <div className="np-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="np-transport">
            <button className={`icon-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} aria-label="Shuffle">
              <ShuffleIcon />
            </button>
            <button className="icon-btn" onClick={playPrevious} aria-label="Previous">
              <PrevIcon size={26} />
            </button>
            <button className="icon-btn play-btn-lg" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>
            <button className="icon-btn" onClick={playNext} aria-label="Next">
              <NextIcon size={26} />
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
      ) : (
        <ul className="item-list np-queue-list">
          {queue.map((track, i) => (
            <li key={track.id}>
              <button
                className={`item-row track-row ${currentTrack.id === track.id ? 'playing' : ''}`}
                onClick={() => playQueue(queue, i)}
              >
                <TrackArt trackId={track.id} playing={isPlaying && currentTrack.id === track.id} size="sm" />
                <span className="item-name">{trackTitle(track)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
