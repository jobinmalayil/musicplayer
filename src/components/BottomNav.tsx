import { usePlayer } from '../context/PlayerContext';
import { DiscIcon, HomeIcon, ListIcon } from './icons';

export type View = 'library' | 'playlists';

interface BottomNavProps {
  view: View;
  onChangeView: (view: View) => void;
}

export function BottomNav({ view, onChangeView }: BottomNavProps) {
  const { currentTrack, screenOpen, openScreen, closeScreen } = usePlayer();

  const goTo = (next: View) => {
    closeScreen();
    onChangeView(next);
  };

  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-tab ${!screenOpen && view === 'library' ? 'active' : ''}`} onClick={() => goTo('library')}>
        <HomeIcon />
        <span>Library</span>
      </button>
      <button
        className={`bottom-nav-tab ${!screenOpen && view === 'playlists' ? 'active' : ''}`}
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
    </nav>
  );
}
