import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayCounts } from '../context/PlayCountsContext';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylists } from '../context/PlaylistsContext';
import { useRecentlyPlayed } from '../context/RecentlyPlayedContext';
import { useTrackMetadata } from '../hooks/useTrackMetadata';
import { getRootFolderId, listFolder, trackTitle, type Track } from '../lib/drive';
import { TrackArt } from './TrackArt';
import { TrackRow } from './TrackRow';
import { PlaylistArt } from './PlaylistArt';
import { SkinPickerSheet } from './SkinPickerSheet';
import { LogoutIcon, PaletteIcon } from './icons';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function TrackCard({ track, subtitle, onClick }: { track: Track; subtitle?: string; onClick: () => void }) {
  const meta = useTrackMetadata(track);
  return (
    <button className="hscroll-card" onClick={onClick}>
      <TrackArt trackId={track.id} size="md" coverUrl={meta.coverUrl} />
      <span className="item-name">{meta.title || trackTitle(track)}</span>
      <span className="track-subtitle">{subtitle ?? meta.artist ?? ''}</span>
    </button>
  );
}

export function Home() {
  const { disconnect } = useAuth();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const { playlists } = usePlaylists();
  const { recentlyPlayed } = useRecentlyPlayed();
  const { getCount } = usePlayCounts();

  const [libraryTracks, setLibraryTracks] = useState<Track[]>([]);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

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

  const recentlyAdded = useMemo(() => {
    return [...libraryTracks]
      .filter((t) => t.modifiedTime)
      .sort((a, b) => new Date(b.modifiedTime!).getTime() - new Date(a.modifiedTime!).getTime())
      .slice(0, 10);
  }, [libraryTracks]);

  const mostPlayed = useMemo(() => {
    return libraryTracks
      .map((track) => ({ track, count: getCount(track.id) }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [libraryTracks, getCount]);

  const recommended = useMemo(() => {
    const recentIds = new Set(recentlyPlayed.map((t) => t.id));
    return libraryTracks.filter((t) => !recentIds.has(t.id)).slice(0, 10);
  }, [libraryTracks, recentlyPlayed]);

  return (
    <div className="library">
      <div className="home-header-row">
        <div className="home-identity">
          <div className="home-avatar" aria-hidden="true">
            <img src="/artist-photos/jobin-abraham.jpg" alt="" className="home-avatar-img" />
          </div>
          <h1 className="home-greeting">{greeting()}</h1>
        </div>
        <div className="home-header-actions">
          <button className="icon-btn" onClick={() => setThemePickerOpen(true)} aria-label="Change theme">
            <PaletteIcon size={20} />
          </button>
          <button className="icon-btn sign-out-btn" onClick={disconnect} aria-label="Sign out">
            <LogoutIcon size={20} />
          </button>
        </div>
      </div>

      {themePickerOpen && <SkinPickerSheet onClose={() => setThemePickerOpen(false)} />}

      {recentlyPlayed.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recently played</h2>
          <div className="hscroll">
            {recentlyPlayed.slice(0, 10).map((track, i) => (
              <TrackCard key={track.id} track={track} onClick={() => playQueue(recentlyPlayed, i)} />
            ))}
          </div>
        </section>
      )}

      {recentlyAdded.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Recently added</h2>
          <div className="hscroll">
            {recentlyAdded.map((track, i) => (
              <TrackCard key={track.id} track={track} onClick={() => playQueue(recentlyAdded, i)} />
            ))}
          </div>
        </section>
      )}

      {mostPlayed.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">Most played</h2>
          <div className="hscroll">
            {mostPlayed.map(({ track, count }, i) => (
              <TrackCard
                key={track.id}
                track={track}
                subtitle={`${count} play${count === 1 ? '' : 's'}`}
                onClick={() => playQueue(mostPlayed.map((entry) => entry.track), i)}
              />
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
