import { useEffect, useState } from 'react';
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
  size?: 'sm' | 'md' | 'lg';
  coverUrl?: string;
}

export function TrackArt({ trackId, playing = false, size = 'sm', coverUrl }: TrackArtProps) {
  // The AI-art fallback has no uptime guarantee, so an image that fails to
  // load just falls back to the plain gradient rather than a broken icon.
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [coverUrl]);
  const showCover = Boolean(coverUrl) && !imgError;

  return (
    <div
      className={`track-art track-art-${size} ${showCover ? 'has-cover' : ''}`}
      style={showCover ? undefined : { backgroundImage: trackGradient(trackId) }}
    >
      {showCover && <img className="track-art-img" src={coverUrl} alt="" onError={() => setImgError(true)} />}
      {playing && (showCover ? <span className="track-art-scrim" aria-hidden="true" /> : null)}
      {playing ? (
        <span className="eq-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        !showCover && NOTE_ICON
      )}
    </div>
  );
}
