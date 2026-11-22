import { rfc822 } from './dates.js';
import { absoluteUrl, itemGuid, itemPath, SITE_DESCRIPTION } from './site.js';

function stripInvalidXml(value) {
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

export function escapeXml(value) {
  return stripInvalidXml(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function cdata(value) {
  return stripInvalidXml(value).replaceAll(']]>', ']]]]><![CDATA[>');
}

function latestStamp(items) {
  let latest = '';
  for (const item of items) {
    const stamp = item.updated || item.published;
    if (stamp > latest) latest = stamp;
  }
  return latest;
}

export function renderFeed({ title, selfPath, items, description = SITE_DESCRIPTION }) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '<channel>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(absoluteUrl('/'))}</link>`,
    `<atom:link href="${escapeXml(absoluteUrl(selfPath))}" rel="self" type="application/rss+xml"/>`,
    `<description>${escapeXml(description)}</description>`,
    '<language>zh-CN</language>',
  ];
  const latest = latestStamp(items);
  if (latest) lines.push(`<lastBuildDate>${rfc822(latest)}</lastBuildDate>`);
  for (const item of items) {
    const link = absoluteUrl(itemPath(item.source, item.slug));
    const updated = item.updated || item.published;
    const body = stripInvalidXml(item.feedHtml);
    lines.push(
      '<item>',
      `<title>${escapeXml(item.title)}</title>`,
      `<link>${escapeXml(link)}</link>`,
      `<guid isPermaLink="false">${escapeXml(itemGuid(item.source, item.slug))}</guid>`,
      `<pubDate>${rfc822(item.published)}</pubDate>`,
      `<atom:updated>${escapeXml(updated)}</atom:updated>`,
      `<category>${escapeXml(item.source)}</category>`,
      `<description>${escapeXml(body)}</description>`,
      `<content:encoded><![CDATA[${cdata(body)}]]></content:encoded>`,
      '</item>',
    );
  }
  lines.push('</channel>', '</rss>', '');
  return lines.join('\n');
}
