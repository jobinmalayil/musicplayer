import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isSignedIn, signIn, signOut } from '../lib/googleAuth';

interface AuthContextValue {
  signedIn: boolean;
  error: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await signIn();
      setSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    signOut();
    setSignedIn(false);
  }, []);

  const value = useMemo(
    () => ({ signedIn, error, connecting, connect, disconnect }),
    [signedIn, error, connecting, connect, disconnect],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
