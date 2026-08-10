import { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { PlaylistsProvider } from './context/PlaylistsContext';
import { Library } from './components/Library';
import { Playlists } from './components/Playlists';
import { NowPlayingBar } from './components/NowPlayingBar';
import { BottomNav, type View } from './components/BottomNav';
import './App.css';

export default function App() {
  const [view, setView] = useState<View>('library');

  return (
    <PlayerProvider>
      <PlaylistsProvider>
        <div className="app-shell">
          <header className="app-header">
            <h1>Drive Music</h1>
          </header>
          <main className="app-main">{view === 'library' ? <Library /> : <Playlists />}</main>
          <NowPlayingBar />
          <BottomNav view={view} onChangeView={setView} />
        </div>
      </PlaylistsProvider>
    </PlayerProvider>
  );
}
