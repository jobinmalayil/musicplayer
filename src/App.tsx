import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { PlaylistsProvider } from './context/PlaylistsContext';
import { RecentlyPlayedProvider } from './context/RecentlyPlayedContext';
import { PlayCountsProvider } from './context/PlayCountsContext';
import { MetadataOverridesProvider } from './context/MetadataOverridesContext';
import { setActiveShareToken } from './lib/drive';
import { LoginScreen } from './components/LoginScreen';
import { Home } from './components/Home';
import { Library } from './components/Library';
import { Playlists } from './components/Playlists';
import { Admin } from './components/Admin';
import { PublicSharePlayer } from './components/PublicSharePlayer';
import { NowPlayingBar } from './components/NowPlayingBar';
import { PullToRefresh } from './components/PullToRefresh';
import { RecentlyPlayedTracker } from './components/RecentlyPlayedTracker';
import { PlayCountTracker } from './components/PlayCountTracker';
import { SharedTrackHandler } from './components/SharedTrackHandler';
import { BottomNav, type View } from './components/BottomNav';
import './App.css';

const VIEWS: Record<View, () => React.JSX.Element> = {
  home: Home,
  library: Library,
  playlists: Playlists,
  admin: Admin,
};

function AppShell() {
  const { checking, signedIn, isAdmin } = useAuth();
  const [view, setView] = useState<View>('home');
  const activeView = view === 'admin' && !isAdmin ? 'home' : view;
  const ActiveView = VIEWS[activeView];

  if (checking) return null;

  if (!signedIn) {
    const params = new URLSearchParams(window.location.search);
    const sharedTrackId = params.get('track');
    const shareToken = params.get('t');
    if (sharedTrackId && shareToken) {
      setActiveShareToken(shareToken);
      return (
        <PlayerProvider>
          <PublicSharePlayer trackId={sharedTrackId} />
        </PlayerProvider>
      );
    }
    return <LoginScreen />;
  }

  return (
    <PlayerProvider>
      <PlaylistsProvider>
        <RecentlyPlayedProvider>
          <PlayCountsProvider>
            <MetadataOverridesProvider>
              <RecentlyPlayedTracker />
              <PlayCountTracker />
              <SharedTrackHandler />
              <div className="app-shell">
                <PullToRefresh>
                  <ActiveView />
                </PullToRefresh>
                <NowPlayingBar />
                <BottomNav view={view} onChangeView={setView} />
              </div>
            </MetadataOverridesProvider>
          </PlayCountsProvider>
        </RecentlyPlayedProvider>
      </PlaylistsProvider>
    </PlayerProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
