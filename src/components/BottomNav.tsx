import { usePlayer } from '../context/PlayerContext';
import { DiscIcon, HomeIcon } from './icons';

export function BottomNav() {
  const { currentTrack, screenOpen, openScreen, closeScreen } = usePlayer();

  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-tab ${!screenOpen ? 'active' : ''}`} onClick={closeScreen}>
        <HomeIcon />
        <span>Library</span>
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
