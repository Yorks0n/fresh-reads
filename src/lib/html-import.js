import { renderImportedFragment } from './render.js';

export function extractHtmlBody(document) {
  const source = String(document).replace(/^\uFEFF/, '');
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1];
  return source
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, '');
}

export function importHtmlDocument(document) {
  return renderImportedFragment(extractHtmlBody(document));
}

export function markdownFromImport(meta, html) {
  const fields = ['title', 'source', 'published', 'slug'];
  if (meta.updated) fields.push('updated');
  if (meta.summary) fields.push('summary');
  if (meta.lang) fields.push('lang');
  const lines = ['---'];
  for (const key of fields) lines.push(`${key}: ${JSON.stringify(meta[key])}`);
  lines.push('---', '', html.trim(), '');
  return lines.join('\n');
}
