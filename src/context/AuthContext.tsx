import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuthStatus, login as apiLogin, logout as apiLogout, type Role } from '../lib/auth';

interface AuthContextValue {
  checking: boolean;
  signedIn: boolean;
  username: string | null;
  role: Role | null;
  isAdmin: boolean;
  connecting: boolean;
  error: string | null;
  connect: (username: string, password: string) => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyStatus = (status: { authenticated: boolean; username?: string; role?: Role }) => {
    setSignedIn(status.authenticated);
    setUsername(status.authenticated ? (status.username ?? null) : null);
    setRole(status.authenticated ? (status.role ?? null) : null);
  };

  useEffect(() => {
    getAuthStatus()
      .then(applyStatus)
      .catch(() => setSignedIn(false))
      .finally(() => setChecking(false));
  }, []);

  const connect = useCallback(async (username: string, password: string) => {
    setConnecting(true);
    setError(null);
    try {
      await apiLogin(username, password);
      const status = await getAuthStatus();
      applyStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    void apiLogout();
    setSignedIn(false);
    setUsername(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ checking, signedIn, username, role, isAdmin: role === 'admin', connecting, error, connect, disconnect }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
