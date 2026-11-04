import { defineConfig } from 'vitest/config';
import { siteFilesPlugin, swPlugin } from './scripts/vite-plugins';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [siteFilesPlugin(), swPlugin()],
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        notFound: '404.html',
      },
    },
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
