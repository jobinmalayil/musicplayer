import { useCallback, useEffect, useState } from 'react';
import { getBreadcrumb, getRootFolderId, listFolder, searchTracks, type DriveItem, type Track } from '../lib/drive';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from './TrackRow';
import { AddToPlaylistSheet } from './AddToPlaylistSheet';
import { GroupedTracksView } from './GroupedTracksView';
import { AlbumIcon, PersonIcon } from './icons';

const FOLDER_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M10 4H2v16h20V6H12z" />
  </svg>
);

type LibraryTab = 'songs' | 'artists' | 'albums';

function SongsTab() {
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DriveItem[]>([]);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  const loadFolder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [{ folders, tracks }, crumbs] = await Promise.all([listFolder(id), getBreadcrumb(id)]);
      setFolders(folders);
      setTracks(tracks);
      setBreadcrumb(crumbs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  }, []);

  // Jump straight into the app's configured root folder on first load.
  useEffect(() => {
    let cancelled = false;
    getRootFolderId()
      .then((id) => {
        if (cancelled) return;
        setRootFolderId(id);
        setFolderId(id);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to locate the shared folder');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (folderId) void loadFolder(folderId);
  }, [folderId, loadFolder]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchTracks(trimmed)
        .then(setSearchResults)
        .catch((err) => setError(err instanceof Error ? err.message : 'Search failed'))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const displayedTracks = searchResults ?? tracks;

  return (
    <>
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search your music…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searchResults === null && rootFolderId && (
        <nav className="breadcrumb">
          <button onClick={() => setFolderId(rootFolderId)} className={folderId === rootFolderId ? 'active' : ''}>
            Home
          </button>
          {breadcrumb.map((crumb) => (
            <span key={crumb.id}>
              <span className="sep">/</span>
              <button onClick={() => setFolderId(crumb.id)} className={folderId === crumb.id ? 'active' : ''}>
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {error && <p className="error-text">{error}</p>}
      {(loading || searching) && <p className="hint-text">Loading…</p>}

      {searchResults === null && !loading && folders.length > 0 && (
        <ul className="item-list">
          {folders.map((folder) => (
            <li key={folder.id}>
              <button className="item-row folder-row" onClick={() => setFolderId(folder.id)}>
                <span className="item-icon">{FOLDER_ICON}</span>
                <span className="item-name">{folder.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !searching && displayedTracks.length === 0 && folders.length === 0 && (
        <p className="hint-text">{searchResults ? 'No matching tracks.' : 'No audio files in this folder.'}</p>
      )}

      {displayedTracks.length > 0 && (
        <ul className="item-list track-list">
          {displayedTracks.map((track, i) => (
            <li key={track.id}>
              <TrackRow
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                onClick={() => playQueue(displayedTracks, i)}
                onAddToPlaylist={setAddingTrack}
              />
            </li>
          ))}
        </ul>
      )}

      {addingTrack && <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />}
    </>
  );
}

export function Library() {
  const [tab, setTab] = useState<LibraryTab>('songs');

  return (
    <div className="library">
      <h1 className="home-greeting">Library</h1>
      <nav className="filter-pills">
        <button className={tab === 'songs' ? 'active' : ''} onClick={() => setTab('songs')}>
          Songs
        </button>
        <button className={tab === 'artists' ? 'active' : ''} onClick={() => setTab('artists')}>
          Artists
        </button>
        <button className={tab === 'albums' ? 'active' : ''} onClick={() => setTab('albums')}>
          Albums
        </button>
      </nav>

      {tab === 'songs' && <SongsTab />}
      {tab === 'artists' && (
        <GroupedTracksView
          groupBy="artist"
          icon={<PersonIcon size={18} />}
          emptyLabel="No audio files found."
          unknownLabel="Unknown Artist"
        />
      )}
      {tab === 'albums' && (
        <GroupedTracksView
          groupBy="album"
          icon={<AlbumIcon size={18} />}
          emptyLabel="No audio files found."
          unknownLabel="Unknown Album"
        />
      )}
    </div>
  );
}
