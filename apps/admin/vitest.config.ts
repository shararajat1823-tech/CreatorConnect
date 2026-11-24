import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate from vite.config.ts so the production build's type-check doesn't
// depend on Vitest's bundled Vite types.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    css: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
