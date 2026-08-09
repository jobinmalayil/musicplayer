import { trackGradient } from '../lib/trackArt';

const NOTE_ICON = (
  <svg viewBox="0 0 24 24" width="42%" height="42%" fill="currentColor">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
  </svg>
);

interface TrackArtProps {
  trackId: string;
  playing?: boolean;
  size?: 'sm' | 'lg';
}

export function TrackArt({ trackId, playing = false, size = 'sm' }: TrackArtProps) {
  return (
    <div className={`track-art track-art-${size}`} style={{ backgroundImage: trackGradient(trackId) }}>
      {playing ? (
        <span className="eq-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        NOTE_ICON
      )}
    </div>
  );
}
