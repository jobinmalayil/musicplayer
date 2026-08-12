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
        <div className="login-photo" aria-hidden="true">
          <img src="/artist-photos/jobin-abraham.jpg" alt="" className="login-photo-img" />
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
