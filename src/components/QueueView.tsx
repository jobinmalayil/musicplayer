import { usePlayer } from '../context/PlayerContext';
import { trackTitle } from '../lib/drive';

export function QueueView({ onClose }: { onClose: () => void }) {
  const { queue, currentTrack, playQueue } = usePlayer();

  return (
    <div className="queue-overlay">
      <div className="queue-header">
        <h2>Up Next</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <ul className="item-list">
        {queue.map((track, i) => (
          <li key={track.id}>
            <button
              className={`item-row track-row ${currentTrack?.id === track.id ? 'playing' : ''}`}
              onClick={() => playQueue(queue, i)}
            >
              <span className="item-name">{trackTitle(track)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
