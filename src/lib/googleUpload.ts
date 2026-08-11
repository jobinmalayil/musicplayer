// Uploading has to happen straight from the browser to Google Drive: the
// server's service account has zero storage quota on a personal (non-
// Workspace) Google account and can't create files at all, and routing
// large audio files through a Vercel function would blow past its request
// body limits anyway. So this asks the signed-in admin's own Google
// account for a short-lived, upload-only OAuth token (drive.file scope —
// it can only touch files this app itself creates) and uploads directly.

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const UPLOAD_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let gisLoadPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Prompts the admin (via Google's consent popup, once per ~1hr token) for permission to add files. */
export async function requestUploadToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) return cachedToken.token;

  const clientId = import.meta.env.VITE_GOOGLE_UPLOAD_CLIENT_ID;
  if (!clientId) throw new Error('Uploads are not configured (missing VITE_GOOGLE_UPLOAD_CLIENT_ID)');

  await loadGis();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: UPLOAD_SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error ?? 'Google sign-in was cancelled'));
          return;
        }
        cachedToken = { token: response.access_token, expiresAt: Date.now() + 55 * 60 * 1000 };
        resolve(response.access_token);
      },
    });
    client.requestAccessToken();
  });
}

interface UploadOptions {
  file: File;
  folderId: string;
  token: string;
  onProgress?: (fraction: number) => void;
}

/** Uploads one file to Drive via the resumable upload protocol, reporting progress along the way. */
export function uploadFileToDrive({ file, folderId, token, onProgress }: UploadOptions): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const init = new XMLHttpRequest();
    init.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable');
    init.setRequestHeader('Authorization', `Bearer ${token}`);
    init.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    init.onload = () => {
      if (init.status < 200 || init.status >= 300) {
        reject(new Error(`Failed to start upload: ${init.status} ${init.responseText}`));
        return;
      }
      const sessionUrl = init.getResponseHeader('Location');
      if (!sessionUrl) {
        reject(new Error('Drive did not return an upload session URL'));
        return;
      }

      const put = new XMLHttpRequest();
      put.open('PUT', sessionUrl);
      put.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      put.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      put.onload = () => {
        if (put.status < 200 || put.status >= 300) {
          reject(new Error(`Upload failed: ${put.status} ${put.responseText}`));
          return;
        }
        onProgress?.(1);
        resolve(JSON.parse(put.responseText) as { id: string });
      };
      put.onerror = () => reject(new Error('Upload failed — network error'));
      put.send(file);
    };
    init.onerror = () => reject(new Error('Failed to start upload — network error'));
    init.send(JSON.stringify({ name: file.name, parents: [folderId] }));
  });
}
