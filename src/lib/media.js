import fs from 'node:fs';
import path from 'node:path';
import { loadArchive } from './content.js';
import { BASE_PATH, IMAGE_EXTENSIONS } from './site.js';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

export function copyContentMedia(outDir) {
  const archive = loadArchive();
  for (const media of archive.media) {
    const dest = path.resolve(outDir, 'media', ...media.relPath.split('/'));
    const rel = path.relative(path.resolve(outDir), dest);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`拒绝写出媒体文件：${media.relPath}`);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(media.absPath, dest);
  }
}

export function mediaDevPlugin() {
  return {
    name: 'fresh-reads-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '').split('?')[0]);
        const marker = '/media/';
        const index = pathname.indexOf(marker);
        if (index === -1) {
          next();
          return;
        }
        const prefix = pathname.slice(0, index);
        if (prefix !== BASE_PATH && prefix !== '') {
          next();
          return;
        }
        const rel = pathname.slice(index + marker.length);
        if (!rel || rel.split('/').includes('..')) {
          res.statusCode = 400;
          res.end('bad path');
          return;
        }
        let archive;
        try {
          archive = loadArchive();
        } catch {
          next();
          return;
        }
        const media = archive.media.find((item) => item.relPath === rel);
        if (!media) {
          next();
          return;
        }
        const ext = path.extname(media.absPath).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) {
          res.statusCode = 415;
          res.end('unsupported image');
          return;
        }
        res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        fs.createReadStream(media.absPath).pipe(res);
      });
    },
  };
}
