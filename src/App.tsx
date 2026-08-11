import { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { PlaylistsProvider } from './context/PlaylistsContext';
import { RecentlyPlayedProvider } from './context/RecentlyPlayedContext';
import { Home } from './components/Home';
import { Library } from './components/Library';
import { Playlists } from './components/Playlists';
import { NowPlayingBar } from './components/NowPlayingBar';
import { RecentlyPlayedTracker } from './components/RecentlyPlayedTracker';
import { BottomNav, type View } from './components/BottomNav';
import './App.css';

const VIEWS: Record<View, () => React.JSX.Element> = {
  home: Home,
  library: Library,
  playlists: Playlists,
};

export default function App() {
  const [view, setView] = useState<View>('home');
  const ActiveView = VIEWS[view];

  return (
    <PlayerProvider>
      <PlaylistsProvider>
        <RecentlyPlayedProvider>
          <RecentlyPlayedTracker />
          <div className="app-shell">
            <main className="app-main">
              <ActiveView />
            </main>
            <NowPlayingBar />
            <BottomNav view={view} onChangeView={setView} />
          </div>
        </RecentlyPlayedProvider>
      </PlaylistsProvider>
    </PlayerProvider>
  );
}
