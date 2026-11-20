import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Caminhos relativos: funciona em GitHub Pages (subpasta) e Netlify sem ajustes.
  base: './',
  define: {
    __VERSAO__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
});
