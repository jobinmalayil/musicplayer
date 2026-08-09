import { useCallback, useEffect, useState } from 'react';
import { getBreadcrumb, listFolder, searchTracks, trackTitle, type DriveItem, type Track } from '../lib/drive';
import { usePlayer } from '../context/PlayerContext';

const FOLDER_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M10 4H2v16h20V6H12z" />
  </svg>
);

const TRACK_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
  </svg>
);

export function Library() {
  const [folderId, setFolderId] = useState('root');
  const [breadcrumb, setBreadcrumb] = useState<DriveItem[]>([]);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { playQueue, currentTrack } = usePlayer();

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

  useEffect(() => {
    void loadFolder(folderId);
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
    <div className="library">
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search your music…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searchResults === null && (
        <nav className="breadcrumb">
          <button onClick={() => setFolderId('root')} className={folderId === 'root' ? 'active' : ''}>
            My Drive
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
        <ul className="item-list">
          {displayedTracks.map((track, i) => (
            <li key={track.id}>
              <button
                className={`item-row track-row ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onClick={() => playQueue(displayedTracks, i)}
              >
                <span className="item-icon">{TRACK_ICON}</span>
                <span className="item-name">{trackTitle(track)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
