import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      lib: path.resolve(__dirname, './lib'),
      data: path.resolve(__dirname, './data'),
      components: path.resolve(__dirname, './components'),
    },
  },
});
