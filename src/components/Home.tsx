import { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useRecentlyPlayed } from '../context/RecentlyPlayedContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { getRootFolderId, listFolder, trackTitle, type Track } from '../lib/drive';
import { TrackArt } from './TrackArt';
import { TrackRow } from './TrackRow';
import { PlaylistArt } from './PlaylistArt';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function RecentCard({ track, onClick }: { track: Track; onClick: () => void }) {
  const meta = useTrackMetadata(track);
  return (
    <button className="hscroll-card" onClick={onClick}>
      <TrackArt trackId={track.id} size="md" coverUrl={meta.coverUrl} />
      <span className="item-name">{meta.title || trackTitle(track)}</span>
      {meta.artist && <span className="track-subtitle">{meta.artist}</span>}
    </button>
  );
}

export function Home() {
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { playlists } = usePlaylists();
  const { recentlyPlayed } = useRecentlyPlayed();

  const [libraryTracks, setLibraryTracks] = useState<Track[]>([]);

  useEffect(() => {
    let cancelled = false;
    getRootFolderId()
      .then((id) => listFolder(id))
      .then(({ tracks }) => {
        if (!cancelled) setLibraryTracks(tracks);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const recommended = useMemo(() => {
    const recentIds = new Set(recentlyPlayed.map((t) => t.id));
    return libraryTracks.filter((t) => !recentIds.has(t.id)).slice(0, 10);
  }, [libraryTracks, recentlyPlayed]);

  return (
    <div className="library">
      <h1 className="home-greeting">{greeting()}</h1>

      {recentlyPlayed.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recently played</h2>
          <div className="hscroll">
            {recentlyPlayed.slice(0, 10).map((track, i) => (
              <RecentCard key={track.id} track={track} onClick={() => playQueue(recentlyPlayed, i)} />
            ))}
          </div>
        </section>
      )}

      {playlists.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Made for you</h2>
          <div className="hscroll">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="hscroll-card"
                disabled={playlist.tracks.length === 0}
                onClick={() => playQueue(playlist.tracks, 0)}
              >
                <PlaylistArt playlist={playlist} />
                <span className="item-name">{playlist.name}</span>
                <span className="track-subtitle">{playlist.tracks.length} tracks</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recommended</h2>
          <ul className="item-list track-list">
            {recommended.map((track, i) => (
              <li key={track.id}>
                <TrackRow
                  track={track}
                  isCurrent={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onClick={() => playQueue(recommended, i)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
