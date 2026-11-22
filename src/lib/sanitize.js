import fs from 'node:fs';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';
import { BASE_PATH, IMAGE_EXTENSIONS, withBase } from './site.js';

const RAW_TEXT_TAGS = ['script', 'style', 'textarea', 'option', 'xmp', 'iframe', 'noscript', 'noembed', 'title'];
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'del', 's', 'ins', 'sub', 'sup', 'mark',
  'ul', 'ol', 'li',
  'blockquote',
  'pre', 'code',
  'a',
  'img',
  'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
];

function classifyUrl(raw) {
  const trimmed = String(raw ?? '').trim();
  const probe = trimmed.replace(/[\u0000-\u001F\u007F]/g, '').toLowerCase();
  if (!probe) return { action: 'drop' };
  if (probe.startsWith('#')) return { action: 'keep', value: trimmed };
  if (probe.startsWith('//')) return { action: 'drop' };
  const scheme = probe.match(/^([a-z][a-z0-9+.-]*):/);
  if (scheme) {
    if (scheme[1] === 'http' || scheme[1] === 'https' || scheme[1] === 'mailto') {
      return { action: 'keep', value: trimmed };
    }
    return { action: 'drop' };
  }
  if (trimmed.startsWith('/')) return { action: 'root', value: trimmed };
  return { action: 'relative', value: trimmed };
}

function localImageUrl(src, options, media) {
  if (/[?#]/.test(src)) throw new Error(`图片路径不能带查询参数或锚点：${src}`);
  if (src.includes('\\') || src.includes('\0')) throw new Error(`图片路径无效：${src}`);
  let decoded;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    throw new Error(`图片路径无法解码：${src}`);
  }
  const root = path.resolve(options.contentRoot);
  const abs = path.resolve(options.mdDir, decoded);
  const rel = path.relative(root, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`图片必须位于内容目录内：${src}`);
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error(`找不到图片：${src}`);
  const realRoot = fs.realpathSync(root);
  const real = fs.realpathSync(abs);
  const realRel = path.relative(realRoot, real);
  if (!realRel || realRel.startsWith('..') || path.isAbsolute(realRel)) {
    throw new Error(`图片必须位于内容目录内：${src}`);
  }
  const ext = path.extname(real).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(`不支持的图片类型 ${ext}，只能使用 png、jpg、jpeg、gif、webp、avif`);
  }
  const relPosix = rel.split(path.sep).join('/');
  media.push({ absPath: real, relPath: relPosix });
  return `${BASE_PATH}/media/${relPosix.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function rewriteLink(href) {
  const classified = classifyUrl(href);
  if (classified.action === 'drop') return null;
  if (classified.action === 'root') return withBase(classified.value);
  return classified.value;
}

function rewriteImage(src, options, media) {
  const classified = classifyUrl(src);
  if (classified.action === 'drop' || (classified.action === 'keep' && classified.value.startsWith('#'))) return null;
  if (classified.action === 'keep') {
    if (classified.value.toLowerCase().startsWith('mailto:')) return null;
    return classified.value;
  }
  if (classified.action === 'root') return withBase(classified.value);
  if (!options.resolveImages) return classified.value;
  return localImageUrl(classified.value, options, media);
}

function numericAttr(value, pattern) {
  return typeof value === 'string' && pattern.test(value) ? value : null;
}

function cellAttrs(attribs) {
  const next = {};
  const colspan = numericAttr(attribs.colspan, /^[1-9]\d{0,2}$/);
  const rowspan = numericAttr(attribs.rowspan, /^[1-9]\d{0,2}$/);
  if (colspan) next.colspan = colspan;
  if (rowspan) next.rowspan = rowspan;
  return next;
}

export function sanitizeHtmlFragment(html, options = {}) {
  const media = [];
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      ol: ['start'],
      code: ['class'],
    },
    allowedEmptyAttributes: ['alt'],
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: RAW_TEXT_TAGS,
    transformTags: {
      a: (_tagName, attribs) => {
        const href = rewriteLink(attribs.href);
        if (!href) return { tagName: 'span', attribs: {} };
        return { tagName: 'a', attribs: { href } };
      },
      img: (_tagName, attribs) => {
        const src = rewriteImage(attribs.src, options, media);
        if (!src) return { tagName: 'span', attribs: {} };
        const next = { alt: attribs.alt ?? '', src };
        const width = numericAttr(attribs.width, /^\d{1,4}$/);
        const height = numericAttr(attribs.height, /^\d{1,4}$/);
        if (width) next.width = width;
        if (height) next.height = height;
        if (attribs.title) next.title = attribs.title;
        return { tagName: 'img', attribs: next };
      },
      code: (_tagName, attribs) => {
        const next = {};
        if (typeof attribs.class === 'string' && /^language-[a-z0-9+-]+$/i.test(attribs.class)) {
          next.class = attribs.class;
        }
        return { tagName: 'code', attribs: next };
      },
      th: (_tagName, attribs) => ({ tagName: 'th', attribs: cellAttrs(attribs) }),
      td: (_tagName, attribs) => ({ tagName: 'td', attribs: cellAttrs(attribs) }),
      ol: (_tagName, attribs) => {
        const start = numericAttr(attribs.start, /^[1-9]\d{0,5}$/);
        return { tagName: 'ol', attribs: start ? { start } : {} };
      },
    },
  });
  return { html: clean.trim(), media };
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits) => String.fromCodePoint(Number.parseInt(digits, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function normalizeText(value) {
  return decodeHtml(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function stripMatchingH1(html, title) {
  const match = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (!match) return html.trim();
  const inner = match[0].replace(/^<h1\b[^>]*>/i, '').replace(/<\/h1>$/i, '');
  if (normalizeText(inner) !== normalizeText(title)) return html.trim();
  return `${html.slice(0, match.index)}${html.slice(match.index + match[0].length)}`.trim();
}

export function absolutizeHtml(html, origin) {
  return html.replace(/(\s(?:href|src)=")([^"]*)(")/g, (full, prefix, value, suffix) => {
    if (!value.startsWith('/')) return full;
    return `${prefix}${origin}${value}${suffix}`;
  });
}

export function plainExcerpt(html, limit = 140) {
  const text = normalizeText(html);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}
