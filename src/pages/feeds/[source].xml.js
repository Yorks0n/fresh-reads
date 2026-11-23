import { loadArchive } from '../../lib/content.js';
import { renderFeed } from '../../lib/rss.js';
import { SITE_NAME } from '../../lib/site.js';

export function getStaticPaths() {
  const archive = loadArchive();
  return archive.sources.map((source) => ({
    params: { source: source.id },
    props: { sourceId: source.id },
  }));
}

export function GET({ props }) {
  const archive = loadArchive();
  const items = archive.items.filter((item) => item.source === props.sourceId);
  const xml = renderFeed({
    title: `${SITE_NAME} · ${props.sourceId}`,
    selfPath: `/feeds/${props.sourceId}.xml`,
    items,
  });
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
