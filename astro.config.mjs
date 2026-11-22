import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyContentMedia, mediaDevPlugin } from './src/lib/media.js';
import { BASE_PATH, SITE_ORIGIN } from './src/lib/site.js';

const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : 'dist';

export default defineConfig({
  site: SITE_ORIGIN,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  outDir,
  build: {
    format: 'directory',
  },
  integrations: [
    {
      name: 'fresh-reads-media',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          copyContentMedia(fileURLToPath(dir));
        },
      },
    },
  ],
  vite: {
    plugins: [mediaDevPlugin()],
  },
});
