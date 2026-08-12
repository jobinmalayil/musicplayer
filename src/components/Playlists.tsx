import { useState } from 'react';
import { usePlaylists } from '../context/PlaylistsContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from './TrackRow';
import { BackIcon, ListIcon, PlusIcon, TrashIcon } from './icons';

export function Playlists() {
  const { playlists, loading, createPlaylist, deletePlaylist, removeTrack } = usePlaylists();
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = playlists.find((p) => p.id === selectedId) ?? null;

  const handleCreate = () => {
    const name = prompt('Playlist name');
    if (name && name.trim()) setSelectedId(createPlaylist(name.trim()).id);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (confirm(`Delete playlist "${selected.name}"?`)) {
      deletePlaylist(selected.id);
      setSelectedId(null);
    }
  };

  if (selected) {
    return (
      <div className="library">
        <div className="playlist-detail-header">
          <button className="icon-btn" onClick={() => setSelectedId(null)} aria-label="Back">
            <BackIcon />
          </button>
          <h2>{selected.name}</h2>
          <button className="icon-btn" onClick={handleDelete} aria-label="Delete playlist">
            <TrashIcon />
          </button>
        </div>
        {selected.tracks.length === 0 ? (
          <p className="hint-text">No tracks yet — add some from the Library.</p>
        ) : (
          <ul className="item-list track-list">
            {selected.tracks.map((track, i) => (
              <li key={track.id}>
                <TrackRow
                  track={track}
                  isCurrent={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onClick={() => playQueue(selected.tracks, i)}
                  onRemove={() => removeTrack(selected.id, track.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="library">
      <div className="playlist-detail-header">
        <h2>Playlists</h2>
        <button className="icon-btn" onClick={handleCreate} aria-label="New playlist">
          <PlusIcon />
        </button>
      </div>
      {loading ? (
        <p className="hint-text">Loading…</p>
      ) : playlists.length === 0 ? (
        <p className="hint-text">No playlists yet — tap + to create one.</p>
      ) : (
        <ul className="item-list">
          {playlists.map((p) => (
            <li key={p.id}>
              <button className="item-row folder-row" onClick={() => setSelectedId(p.id)}>
                <span className="item-icon">
                  <ListIcon size={20} />
                </span>
                <span className="item-name">{p.name}</span>
                <span className="track-duration">{p.tracks.length} tracks</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
