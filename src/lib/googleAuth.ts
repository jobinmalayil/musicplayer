const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const TOKEN_STORAGE_KEY = 'drive-music.access-token';

interface StoredToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };

type TokenClient = {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type: string }) => void;
          }) => TokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;
let tokenClient: TokenClient | null = null;
let activeCallback: ((resp: TokenResponse) => void) | null = null;

function loadGisScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

function readStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

function writeStoredToken(token: StoredToken | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function ensureTokenClient(): Promise<TokenClient> {
  await loadGisScript();
  if (!tokenClient) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'Missing VITE_GOOGLE_CLIENT_ID. Copy .env.example to .env.local and set your Google OAuth client ID.',
      );
    }
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => activeCallback?.(resp),
      error_callback: (err) => activeCallback?.({ error: err.type }),
    });
  }
  return tokenClient;
}

function requestToken(client: TokenClient, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    activeCallback = (resp) => {
      activeCallback = null;
      if (resp.error || !resp.access_token) {
        reject(new Error(resp.error ?? 'No access token returned'));
        return;
      }
      const expiresAt = Date.now() + (resp.expires_in ?? 3600) * 1000;
      writeStoredToken({ accessToken: resp.access_token, expiresAt });
      resolve(resp.access_token);
    };
    client.requestAccessToken(prompt ? { prompt } : { prompt: '' });
  });
}

let pendingRequest: Promise<string> | null = null;

/** Returns a valid access token, silently refreshing or prompting for login as needed. */
export async function getAccessToken(): Promise<string> {
  const stored = readStoredToken();
  if (stored && stored.expiresAt - Date.now() > 60_000) {
    return stored.accessToken;
  }
  if (pendingRequest) return pendingRequest;

  const client = await ensureTokenClient();
  pendingRequest = requestToken(client, stored ? '' : 'consent').finally(() => {
    pendingRequest = null;
  });
  return pendingRequest;
}

/** Forces the interactive consent screen (used for the initial "Sign in" button). */
export async function signIn(): Promise<string> {
  const client = await ensureTokenClient();
  return requestToken(client, 'consent');
}

export function signOut() {
  const stored = readStoredToken();
  writeStoredToken(null);
  if (stored && window.google) {
    window.google.accounts.oauth2.revoke(stored.accessToken, () => {});
  }
}

export function isSignedIn(): boolean {
  return readStoredToken() !== null;
}
