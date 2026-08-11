import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { connect, connecting, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void connect(username, password);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo" aria-hidden="true">
          <svg viewBox="0 0 512 512" width="64" height="64">
            <circle cx="256" cy="256" r="176" fill="none" stroke="url(#g)" strokeWidth="16" />
            <path d="M210 165 L360 256 L210 347 Z" fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6d5bff" />
                <stop offset="100%" stopColor="#00d4c8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>Jobin Abraham Musically</h1>
        <p>Sign in to listen.</p>
        <input
          type="text"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={connecting || !username || !password}>
          {connecting ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
