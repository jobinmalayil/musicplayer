# Drive Music Player

A music player that streams your library straight from Google Drive. React + Vite + TypeScript, installable as a PWA (works great added to the iOS home screen).

## Features

- Browse your Drive folder structure and search across all audio files by name
- Full player: play/pause, next/previous, seek, shuffle, repeat (off / all / one)
- Lock-screen / notification media controls via the Media Session API
- Installable PWA — "Add to Home Screen" on iOS gives it a standalone, full-screen app experience
- Fully public, no login required for visitors — a small serverless proxy handles Google auth server-side

> **This app has no access control.** Anyone with the site's URL can browse and stream everything in the configured folder — there's no Google sign-in and no password. Only put music you're fine making public into that folder.

## How it works

Google's Drive API doesn't support truly anonymous access, even to files shared "Anyone with the link" — that sharing mode only works for people opening the link in Drive's own web app. So instead, a tiny serverless function ([api/drive.ts](api/drive.ts)) authenticates to Google as a **service account** (a credential you control, kept server-side only) and proxies list/search/breadcrumb/stream requests. Visitors never see any Google auth at all — the app just works.

- **Browsing**: the proxy calls Drive's `files.list`/`files.get` using the service account's token.
- **Streaming**: [api/_driveHandler.ts](api/_driveHandler.ts) forwards the browser's `Range` header to Drive and streams the response back (capped per-request to stay under serverless response-size limits — the player just requests more as needed, so seeking still works normally).
- **Local dev**: [vite.config.ts](vite.config.ts) mounts the exact same handler as Vite dev-server middleware, so `npm run dev` behaves identically to the deployed version — no need for the Vercel CLI locally.
- **Playback engine**: [src/context/PlayerContext.tsx](src/context/PlayerContext.tsx) manages the queue, shuffle order, repeat mode, and wires the Media Session API for lock-screen controls.

## 1. Enable the Drive API

[Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services → Library** → search **Google Drive API** → **Enable**.

## 2. Create a service account + key

1. **APIs & Services → Credentials → Create Credentials → Service account**. Any name is fine → Create and continue → skip the optional steps → Done.
2. Click into it → **Keys** tab → **Add Key → Create new key → JSON**. This downloads a `.json` file — keep it private, don't commit it anywhere.
3. If key creation is blocked with *"Service account key creation is disabled"* (a Google "secure by default" org policy), go to:
   ```
   https://console.cloud.google.com/iam-admin/orgpolicies/iam-disableServiceAccountKeyCreation?project=YOUR_PROJECT_ID
   ```
   and override the policy to allow it for this project, then retry step 2.
4. Open the downloaded JSON — you need its `client_email` and `private_key` values.

## 3. Share your folder with the service account

In Google Drive, open the folder you want the app to serve → **Share** → add the service account's `client_email` as **Viewer**.

Also grab that folder's ID from its URL: `drive.google.com/drive/folders/THIS_PART`.

## 4. Configure the app

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id
```

The private key is the JSON file's `private_key` field pasted as-is (it already contains literal `\n` sequences) — no `VITE_` prefix on any of these, since they must never reach the browser bundle.

## 5. Run it

```bash
npm install
npm run dev
```

Open the printed local URL — the library loads immediately, no login screen.

## 6. Deploy

```bash
npm run build
```

On Vercel (or any host that supports Node serverless functions alongside static hosting):
- Deploy the repo as-is — Vercel auto-detects `api/drive.ts` as a serverless function.
- Set `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, and `GOOGLE_DRIVE_ROOT_FOLDER_ID` as **environment variables** in your project settings (not as build-time `VITE_` vars — these are read at request time by the serverless function).
- If your host has its own access-protection feature enabled (e.g. Vercel's Deployment Protection), turn it off if you want the public/no-login experience — otherwise visitors hit your host's login wall before ever reaching the app.

## 7. Add to iOS home screen

Open the deployed site in **Safari** on iPhone/iPad → Share → **Add to Home Screen**. It launches full-screen, without Safari's browser chrome, using the app icon and name configured in the manifest.

## Limitations

- Drive doesn't expose ID3 tags via its API, so track titles come from the filename (extension stripped) rather than embedded artist/album metadata.
- No access control of any kind — see the warning above.
- Each streamed request is capped at 4MB; large files just take a couple of extra round trips rather than one, which is invisible in normal playback but means very slow connections may see brief pauses between chunks.
