import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    root: path.resolve(__dirname, 'frontend'),

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend'),
      },
    },

    server: {
      allowedHosts: ['codesentinel-ai-qrd2.onrender.com'],

      // Preserve the existing HMR configuration.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Preserve the existing file-watching configuration.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

    preview: {
      allowedHosts: ['codesentinel-ai-qrd2.onrender.com'],
    },
  };
});
