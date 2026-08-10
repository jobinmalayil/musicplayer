import { PlayerProvider } from './context/PlayerContext';
import { Library } from './components/Library';
import { NowPlayingBar } from './components/NowPlayingBar';
import './App.css';

export default function App() {
  return (
    <PlayerProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1>Drive Music</h1>
        </header>
        <main className="app-main">
          <Library />
        </main>
        <NowPlayingBar />
      </div>
    </PlayerProvider>
  );
}
