// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { createShikiConfig } from '@kolektiv/common-docs-chrome';

import { docs } from './src/docs-chrome.ts';

export default defineConfig({
  site: docs.siteUrl,
  base: docs.base,
  markdown: {
    shikiConfig: createShikiConfig(docs.themes),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
