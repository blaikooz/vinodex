import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest for the ported VinodexCore logic (quiz, chip filter, passport, streak,
// bookmarks, recents). jsdom gives the localStorage-backed stores a window.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['web/**/*.test.ts'],
    globals: false,
  },
});
