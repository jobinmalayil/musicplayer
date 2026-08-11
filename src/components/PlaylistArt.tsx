import { trackGradient } from '../lib/trackArt';
import type { Playlist } from '../context/PlaylistsContext';

const NOTE_ICON = (
  <svg viewBox="0 0 24 24" width="38%" height="38%" fill="currentColor">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
  </svg>
);

/** A 2x2 collage of the first four tracks' colors, or a single note-icon block when empty. */
export function PlaylistArt({ playlist }: { playlist: Playlist }) {
  if (playlist.tracks.length === 0) {
    return (
      <div className="playlist-card-art single" style={{ backgroundImage: trackGradient(playlist.id) }}>
        {NOTE_ICON}
      </div>
    );
  }

  const quadrants = Array.from({ length: 4 }, (_, i) => playlist.tracks[i % playlist.tracks.length]);

  return (
    <div className="playlist-card-art">
      {quadrants.map((track, i) => (
        <span key={i} style={{ backgroundImage: trackGradient(track.id) }} />
      ))}
    </div>
  );
}
