import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { LoginScreen } from './components/LoginScreen';
import { Library } from './components/Library';
import { NowPlayingBar } from './components/NowPlayingBar';
import './App.css';

function AppShell() {
  const { signedIn, disconnect } = useAuth();

  if (!signedIn) return <LoginScreen />;

  return (
    <PlayerProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1>Drive Music</h1>
          <button className="btn-link" onClick={disconnect}>
            Sign out
          </button>
        </header>
        <main className="app-main">
          <Library />
        </main>
        <NowPlayingBar />
      </div>
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
