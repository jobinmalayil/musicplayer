import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { connect, connecting, error } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-glow login-glow-1" aria-hidden="true" />
      <div className="login-glow login-glow-2" aria-hidden="true" />
      <div className="login-card">
        <div className="login-logo" aria-hidden="true">
          <svg viewBox="0 0 512 512" width="64" height="64">
            <circle cx="256" cy="256" r="176" fill="none" stroke="url(#g)" strokeWidth="16" />
            <path d="M210 165 L360 256 L210 347 Z" fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>
          Sound Moves.
          <br />
          Dive Into Music.
        </h1>
        <p>Play the music library stored in your Google Drive, right from the browser.</p>
        <button className="btn-primary" onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting…' : 'Connect Google Drive'}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
