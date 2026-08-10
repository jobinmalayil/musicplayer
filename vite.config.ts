import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Serves the same Drive proxy locally that Vercel serves in production, so
// `npm run dev` works standalone without needing the Vercel CLI.
function driveApiDevMiddleware(env: Record<string, string>): Plugin {
  return {
    name: 'drive-api-dev-middleware',
    configureServer(server) {
      for (const key of ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_DRIVE_ROOT_FOLDER_ID']) {
        if (env[key]) process.env[key] = env[key]
      }
      server.middlewares.use('/api/drive', async (req, res) => {
        const { handleDriveRequest } = await import('./api/_driveHandler.ts')
        await handleDriveRequest(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      driveApiDevMiddleware(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Drive Music Player',
          short_name: 'DriveMusic',
          description: 'A music player backed by your Google Drive library',
          theme_color: '#0f0f13',
          background_color: '#0f0f13',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Audio streams and Drive data come from our own /api proxy; never
          // let the SW cache/intercept those requests.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
  }
})
