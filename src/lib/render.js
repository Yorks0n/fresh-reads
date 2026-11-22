import { Marked } from 'marked';
import { SITE_ORIGIN } from './site.js';
import { absolutizeHtml, plainExcerpt, sanitizeHtmlFragment, stripMatchingH1 } from './sanitize.js';

const marked = new Marked({ gfm: true, breaks: false });

export function renderDocument({ markdown, title, relPath, mdDir, contentRoot }) {
  const raw = marked.parse(markdown, { async: false });
  if (typeof raw !== 'string') throw new Error('Markdown 渲染没有返回文本');
  let sanitized;
  try {
    sanitized = sanitizeHtmlFragment(raw, {
      relPath,
      mdDir,
      contentRoot,
      resolveImages: true,
    });
  } catch (error) {
    throw new Error(`${relPath}: ${error.message}`);
  }
  const html = stripMatchingH1(sanitized.html, title);
  return {
    html,
    feedHtml: absolutizeHtml(html, SITE_ORIGIN),
    media: sanitized.media,
    excerpt: plainExcerpt(html),
  };
}

export function renderImportedFragment(html) {
  return sanitizeHtmlFragment(html, { resolveImages: false }).html;
}