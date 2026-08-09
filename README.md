# Drive Music Player

A music player that streams your library straight from Google Drive. React + Vite + TypeScript, installable as a PWA (works great added to the iOS home screen).

## Features

- Browse your Drive folder structure and search across all audio files by name
- Full player: play/pause, next/previous, seek, shuffle, repeat (off / all / one)
- Lock-screen / notification media controls via the Media Session API
- Installable PWA — "Add to Home Screen" on iOS gives it a standalone, full-screen app experience
- No server/backend required — everything runs client-side against the Google Drive API

## 1. Google Cloud setup

You need your own OAuth client ID (it's free, just a few clicks):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or pick an existing one).
2. **APIs & Services → Library** — search for **Google Drive API** and click **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (unless you have a Google Workspace org, then Internal works too).
   - Fill in the app name, your email as support contact, and your email again as developer contact.
   - Scopes: you can skip adding scopes here — the app requests `drive.readonly` at runtime.
   - Test users: add your own Google account. While the app is in "Testing" status only these accounts can sign in, which is exactly what you want for personal use.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: add `http://localhost:5173` for local dev, plus your production URL once you deploy (e.g. `https://your-app.vercel.app`).
   - No redirect URI is needed (the app uses the token/popup flow, not a redirect).
   - Copy the generated **Client ID**.

> Note: while the OAuth consent screen is in "Testing" status, Google shows an "unverified app" warning on first sign-in and access tokens must be refreshed via re-consent roughly every 7 days. For personal use this is fine — just click "Advanced → Go to [app name] (unsafe)" once. Submitting the app for verification removes both limitations if you ever want to share it with others.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your client ID:

```
VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL, click **Connect Google Drive**, and approve access. Your Drive folders and audio files (mp3, m4a, flac, wav, etc.) will show up in the library view.

## 4. Deploy

Build a static bundle and host it anywhere that serves static files (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.):

```bash
npm run build
```

Deploy the `dist/` folder. Remember to:
- Add the deployed origin to **Authorized JavaScript origins** in the Google Cloud OAuth client.
- Set `VITE_GOOGLE_CLIENT_ID` as an environment variable in your hosting provider's build settings (it's read at build time).

## 5. Add to iOS home screen

Open the deployed site in **Safari** on iPhone/iPad → Share → **Add to Home Screen**. It launches full-screen, without Safari's browser chrome, using the app icon and name configured in the manifest.

## How it works

- **Auth**: Google Identity Services (`accounts.google.com/gsi/client`) issues a short-lived OAuth access token for the `drive.readonly` scope. No refresh token/backend is involved — the token is kept in `sessionStorage` and silently re-requested as it nears expiry. See [src/lib/googleAuth.ts](src/lib/googleAuth.ts).
- **Browsing**: [src/lib/drive.ts](src/lib/drive.ts) calls the Drive v3 REST API (`files.list`) to list folders/audio files and to search by name.
- **Streaming**: audio bytes are fetched with the access token attached as an `Authorization` header, then played from an in-memory `blob:` URL (the `<audio>` element can't send custom headers directly, so a direct Drive `alt=media` URL wouldn't work without this step).
- **Playback engine**: [src/context/PlayerContext.tsx](src/context/PlayerContext.tsx) manages the queue, shuffle order, repeat mode, and wires the Media Session API for lock-screen controls.

## Limitations

- Drive doesn't expose ID3 tags via its API, so track titles come from the filename (extension stripped) rather than embedded artist/album metadata.
- Tracks are downloaded fully (not range-streamed) before playback starts, which is fine for typical song-length files but means very large files take longer to start.
