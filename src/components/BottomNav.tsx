import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { DiscIcon, HomeIcon, LibraryIcon, ListIcon, ShieldIcon } from './icons';

export type View = 'home' | 'library' | 'playlists' | 'admin';

interface BottomNavProps {
  view: View;
  onChangeView: (view: View) => void;
}

export function BottomNav({ view, onChangeView }: BottomNavProps) {
  const { isAdmin } = useAuth();
  const { currentTrack, screenOpen, openScreen, closeScreen } = usePlayer();

  const goTo = (next: View) => {
    closeScreen();
    onChangeView(next);
  };

  const tabActive = (tab: View) => !screenOpen && view === tab;

  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-tab ${tabActive('home') ? 'active' : ''}`} onClick={() => goTo('home')}>
        <HomeIcon />
        <span>Home</span>
      </button>
      <button className={`bottom-nav-tab ${tabActive('library') ? 'active' : ''}`} onClick={() => goTo('library')}>
        <LibraryIcon />
        <span>Library</span>
      </button>
      <button
        className={`bottom-nav-tab ${tabActive('playlists') ? 'active' : ''}`}
        onClick={() => goTo('playlists')}
      >
        <ListIcon />
        <span>Playlists</span>
      </button>
      <button
        className={`bottom-nav-tab ${screenOpen ? 'active' : ''}`}
        onClick={openScreen}
        disabled={!currentTrack}
      >
        <DiscIcon />
        <span>Now Playing</span>
      </button>
      {isAdmin && (
        <button className={`bottom-nav-tab ${tabActive('admin') ? 'active' : ''}`} onClick={() => goTo('admin')}>
          <ShieldIcon />
          <span>Admin</span>
        </button>
      )}
    </nav>
  );
}
