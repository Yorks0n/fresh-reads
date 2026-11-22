import { loadArchive } from '../../lib/content.js';
import { renderFeed } from '../../lib/rss.js';
import { SITE_NAME } from '../../lib/site.js';

export function GET() {
  const archive = loadArchive();
  const xml = renderFeed({
    title: SITE_NAME,
    selfPath: '/feeds/all.xml',
    items: archive.items,
  });
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
