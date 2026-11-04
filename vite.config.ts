import { defineConfig } from 'vitest/config';
import { swPlugin } from './scripts/vite-plugins';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [swPlugin()],
  build: {
    modulePreload: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    server: {
      deps: {
        inline: ['gifenc'],
      },
    },
  },
});
