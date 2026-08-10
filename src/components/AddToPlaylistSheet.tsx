import { usePlaylists } from '../context/PlaylistsContext';
import { trackTitle, type Track } from '../lib/drive';
import { CloseIcon, ListIcon, PlusIcon } from './icons';

interface AddToPlaylistSheetProps {
  track: Track;
  onClose: () => void;
}

export function AddToPlaylistSheet({ track, onClose }: AddToPlaylistSheetProps) {
  const { playlists, createPlaylist, addTrack } = usePlaylists();

  const handleCreateAndAdd = () => {
    const name = prompt('Playlist name');
    if (!name || !name.trim()) return;
    addTrack(createPlaylist(name.trim()).id, track);
    onClose();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>Add "{trackTitle(track)}" to playlist</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>
        </div>
        <ul className="item-list">
          <li>
            <button className="item-row folder-row" onClick={handleCreateAndAdd}>
              <span className="item-icon">
                <PlusIcon size={18} />
              </span>
              <span className="item-name">New playlist</span>
            </button>
          </li>
          {playlists.map((p) => (
            <li key={p.id}>
              <button
                className="item-row folder-row"
                onClick={() => {
                  addTrack(p.id, track);
                  onClose();
                }}
              >
                <span className="item-icon">
                  <ListIcon size={18} />
                </span>
                <span className="item-name">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
