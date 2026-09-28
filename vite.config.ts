import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { makeShareLinksAbsolute } from './build/shareLinks.ts';

export default defineConfig(({ mode }) => {
  const siteUrl = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL ?? '';
  return {
    base: './',
    build: {
      target: 'es2022',
      outDir: 'dist',
    },
    plugins: [
      {
        name: 'share-links',
        transformIndexHtml: (html: string) => makeShareLinksAbsolute(html, siteUrl),
      },
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'build/**/*.test.ts'],
    },
  };
});
