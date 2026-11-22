import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Caminhos relativos: funciona em GitHub Pages (subpasta) e Netlify sem ajustes.
  base: './',
  // Sem source maps no build publicado: o site não expõe o código-fonte original.
  build: { sourcemap: false },
  define: {
    __VERSAO__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": a atualização só é aplicada quando a pessoa toca em "Atualizar",
      // para nunca recarregar o app no meio de um treino.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Treino – Registro de Musculação',
        short_name: 'Treino',
        description: 'Registre seus treinos de musculação. Funciona offline; os dados ficam no seu aparelho.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
