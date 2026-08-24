import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const DEFAULT_APP_NAME = 'Carshare'
const DEFAULT_APP_DESCRIPTION = 'Shared-car booking for small groups'

/**
 * `index.html` is static, so the app name has to be substituted at build time.
 * Vite's own `%VITE_FOO%` replacement leaves the literal placeholder in place
 * when the variable is unset, which would ship a browser tab reading
 * "%APP_NAME%" -- hence an explicit transform with a real default.
 */
function htmlBranding(name: string, description: string): Plugin {
  return {
    name: 'carshare:html-branding',
    transformIndexHtml(html) {
      return html.replaceAll('%APP_NAME%', name).replaceAll('%APP_DESCRIPTION%', description)
    }
  }
}

export default defineConfig(({ mode }) => {
  // Only VITE_-prefixed variables, matching what the client bundle can see.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const appName = env.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME
  const appDescription = env.VITE_APP_DESCRIPTION?.trim() || DEFAULT_APP_DESCRIPTION

  return {
    plugins: [
      vue(),
      tailwindcss(),
      htmlBranding(appName, appDescription),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          name: appName,
          short_name: appName,
          description: appDescription,
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              // Reads stay usable offline, but a fresh answer always wins.
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Avatars are immutable once uploaded (the filename carries a
              // timestamp), so serving them from cache first is safe.
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-storage-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
