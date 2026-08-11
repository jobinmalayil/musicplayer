import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayCounts } from '../context/PlayCountsContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { hideTrack, trackTitle, unhideTrack, type Track } from '../lib/drive';
import { formatTime } from '../lib/formatTime';
import { shareTrack } from '../lib/share';
import { TrackArt } from './TrackArt';
import { CheckIcon, EyeIcon, EyeOffIcon, HeadphonesIcon, PauseIcon, PlayIcon, PlusIcon, ShareIcon, TrashIcon } from './icons';

interface TrackRowProps {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onClick: () => void;
  showPlayIcon?: boolean;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: (track: Track) => void;
}

export function TrackRow({
  track,
  isCurrent,
  isPlaying,
  onClick,
  showPlayIcon = true,
  onAddToPlaylist,
  onRemove,
}: TrackRowProps) {
  const meta = useTrackMetadata(track);
  const title = meta.title || trackTitle(track);
  const [justCopied, setJustCopied] = useState(false);
  const { getCount } = usePlayCounts();
  const playCount = getCount(track.id);
  const { isAdmin } = useAuth();
  const [hidden, setHidden] = useState(track.hidden ?? false);
  const [togglingHidden, setTogglingHidden] = useState(false);

  const handleShare = async () => {
    const result = await shareTrack(track);
    if (result === 'copied') {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    }
  };

  const handleToggleHidden = async () => {
    const next = !hidden;
    setHidden(next);
    setTogglingHidden(true);
    try {
      await (next ? hideTrack(track.id) : unhideTrack(track.id));
    } catch {
      setHidden(!next);
    } finally {
      setTogglingHidden(false);
    }
  };

  return (
    <div className={`item-row track-row ${isCurrent ? 'playing' : ''} ${hidden ? 'track-hidden' : ''}`}>
      <button className="track-click-area" onClick={onClick}>
        <TrackArt trackId={track.id} playing={isCurrent && isPlaying} size="sm" coverUrl={meta.coverUrl} />
        <span className="track-text">
          <span className="item-name">{title}</span>
          {meta.artist && <span className="track-subtitle">{meta.artist}</span>}
        </span>
        {meta.duration != null && <span className="track-duration">{formatTime(meta.duration)}</span>}
        {playCount > 0 && (
          <span className="track-play-count" title={`${playCount} play${playCount === 1 ? '' : 's'}`}>
            <HeadphonesIcon size={12} />
            {playCount}
          </span>
        )}
        {showPlayIcon && (
          <span className="track-play-icon" aria-hidden="true">
            {isCurrent && isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </span>
        )}
      </button>
      <button
        className="icon-btn track-side-action"
        onClick={handleShare}
        aria-label={justCopied ? 'Link copied' : `Share ${title}`}
      >
        {justCopied ? <CheckIcon size={18} /> : <ShareIcon size={18} />}
      </button>
      {isAdmin && (
        <button
          className="icon-btn track-side-action"
          onClick={handleToggleHidden}
          disabled={togglingHidden}
          aria-label={hidden ? `Unhide ${title}` : `Hide ${title}`}
        >
          {hidden ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      )}
      {onAddToPlaylist && (
        <button className="icon-btn track-side-action" onClick={() => onAddToPlaylist(track)} aria-label="Add to playlist">
          <PlusIcon size={18} />
        </button>
      )}
      {onRemove && (
        <button className="icon-btn track-side-action" onClick={() => onRemove(track)} aria-label="Remove from playlist">
          <TrashIcon size={18} />
        </button>
      )}
    </div>
  );
}
