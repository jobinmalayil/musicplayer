import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuthStatus, login as apiLogin, logout as apiLogout } from '../lib/auth';

interface AuthContextValue {
  checking: boolean;
  signedIn: boolean;
  connecting: boolean;
  error: string | null;
  connect: (username: string, password: string) => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAuthStatus()
      .then(({ authenticated }) => setSignedIn(authenticated))
      .catch(() => setSignedIn(false))
      .finally(() => setChecking(false));
  }, []);

  const connect = useCallback(async (username: string, password: string) => {
    setConnecting(true);
    setError(null);
    try {
      await apiLogin(username, password);
      setSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    void apiLogout();
    setSignedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ checking, signedIn, connecting, error, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
