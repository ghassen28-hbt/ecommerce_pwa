import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,webmanifest}'],
      },
      manifest: {
        name: 'GASTON Gaming Store',
        short_name: 'G Store',
        description: 'Boutique PWA de matériel gaming (GPU, CPU, PC gamer).',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icone/icone_192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icone/icone_512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Voir les produits',
            short_name: 'Produits',
            url: '/products',
            icons: [{ src: '/icone/icone_192x192.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: 'Accéder au panier',
            short_name: 'Panier',
            url: '/panier',
            icons: [{ src: '/icone/icone_192x192.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      },
      devOptions: {
        enabled: true, // Activer en dev pour tester
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
})
