import { useRef, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { trackTitle } from '../lib/drive';
import { formatTime } from '../lib/formatTime';
import { TrackArt } from './TrackArt';
import { TrackRow } from './TrackRow';
import { WaveformProgress } from './WaveformProgress';
import {
  ChevronDownIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from './icons';

export function NowPlayingScreen({ onClose }: { onClose: () => void }) {
  const {
    queue,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    playQueue,
  } = usePlayer();

  const [tab, setTab] = useState<'playing' | 'queue'>('playing');
  const meta = useTrackMetadata(currentTrack);
  const lastVolumeRef = useRef(volume || 1);

  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current || 1);
    }
  };

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
            <TrackArt trackId={currentTrack.id} playing={isPlaying} size="lg" coverUrl={meta.coverUrl} />
          </div>
          <div className="np-meta">
            <h2 className="np-title">{meta.title || trackTitle(currentTrack)}</h2>
            {meta.artist && <p className="np-artist">{meta.artist}</p>}
          </div>

          <div className="np-progress">
            <WaveformProgress trackId={currentTrack.id} currentTime={currentTime} duration={duration} onSeek={seek} />
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

          <div className="np-volume-row">
            <button className="icon-btn" onClick={toggleMute} aria-label={volume > 0 ? 'Mute' : 'Unmute'}>
              <VolumeIcon size={18} muted={volume === 0} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
        </div>
      ) : (
        <ul className="item-list np-queue-list">
          {queue.map((track, i) => (
            <li key={track.id}>
              <TrackRow
                track={track}
                isCurrent={currentTrack.id === track.id}
                isPlaying={isPlaying}
                onClick={() => playQueue(queue, i)}
                showPlayIcon={false}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
