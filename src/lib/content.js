import fs from 'node:fs';
import path from 'node:path';
import { monthLabel } from './dates.js';
import { failContent, isSlug, parseDocument } from './metadata.js';
import { renderDocument } from './render.js';
import { itemGuid, itemPath } from './site.js';

export function defaultContentRoot() {
  if (process.env.CONTENT_DIR) return path.resolve(process.env.CONTENT_DIR);
  return path.resolve('content');
}

function emptyArchive() {
  return { items: [], media: [], sources: [] };
}

function considerMarkdown(rel, abs, files, problems) {
  if (rel.split('/').length !== 2) {
    problems.push(`${rel}: Markdown 必须放在 content/<source>/ 下，不能放在子目录`);
    return;
  }
  if (rel.endsWith('.mdx')) {
    problems.push(`${rel}: 不支持 MDX，请使用普通 Markdown`);
    return;
  }
  if (rel.toLowerCase().endsWith('.md') && !rel.endsWith('.md')) {
    problems.push(`${rel}: 扩展名必须是小写 .md`);
    return;
  }
  if (rel.endsWith('.md')) files.push({ abs, rel });
}

function walk(dir, relPrefix, files, problems) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      problems.push(`${rel}: 不支持符号链接`);
      continue;
    }
    if (entry.isDirectory()) {
      if (!relPrefix && !isSlug(entry.name)) {
        problems.push(`${rel}: 来源目录名必须是小写 slug（字母、数字、短横线）`);
        continue;
      }
      walk(abs, rel, files, problems);
      continue;
    }
    if (entry.isFile() && /\.mdx?$/i.test(entry.name)) considerMarkdown(rel, abs, files, problems);
  }
}

function sortItems(items) {
  return items.sort((a, b) => {
    if (a.published !== b.published) return a.published < b.published ? 1 : -1;
    if (a.source !== b.source) return a.source < b.source ? -1 : 1;
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    return 0;
  });
}

export function listSources(items) {
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.source)) grouped.set(item.source, []);
    grouped.get(item.source).push(item);
  }
  return [...grouped.keys()].sort().map((id) => ({ id, items: grouped.get(id) }));
}

export function groupByMonth(items) {
  const groups = [];
  for (const item of items) {
    const key = item.published.slice(0, 7);
    const last = groups.at(-1);
    if (!last || last.key !== key) {
      groups.push({ key, label: monthLabel(key), items: [item] });
    } else {
      last.items.push(item);
    }
  }
  return groups;
}

export function loadArchive(root = defaultContentRoot()) {
  if (!fs.existsSync(root)) {
    if (process.env.CONTENT_DIR) failContent(`CONTENT_DIR 不存在：${root}`);
    return emptyArchive();
  }

  const files = [];
  const problems = [];
  walk(root, '', files, problems);

  const items = [];
  const mediaMap = new Map();
  for (const file of files) {
    const parsed = parseDocument(fs.readFileSync(file.abs, 'utf8'), file.rel);
    if (parsed.problems.length > 0) {
      problems.push(...parsed.problems);
      continue;
    }
    let rendered;
    try {
      rendered = renderDocument({
        markdown: parsed.body,
        title: parsed.value.title,
        relPath: file.rel,
        mdDir: path.dirname(file.abs),
        contentRoot: root,
      });
    } catch (error) {
      problems.push(error.message);
      continue;
    }
    items.push({
      ...parsed.value,
      summary: parsed.value.summary ?? (rendered.excerpt || null),
      html: rendered.html,
      feedHtml: rendered.feedHtml,
      guid: itemGuid(parsed.value.source, parsed.value.slug),
      path: itemPath(parsed.value.source, parsed.value.slug),
      file: file.rel,
    });
    for (const media of rendered.media) {
      const previous = mediaMap.get(media.relPath);
      if (previous && previous.absPath !== media.absPath) {
        problems.push(`${file.rel}: 媒体路径冲突 ${media.relPath}`);
      } else {
        mediaMap.set(media.relPath, media);
      }
    }
  }

  const seen = new Map();
  for (const item of items) {
    const key = `${item.source}/${item.slug}`;
    if (seen.has(key)) {
      problems.push(`重复的 slug「${item.slug}」（来源 ${item.source}）：${seen.get(key)} 与 ${item.file}`);
    } else {
      seen.set(key, item.file);
    }
  }

  if (problems.length > 0) failContent(problems);
  sortItems(items);
  return { items, media: [...mediaMap.values()], sources: listSources(items) };
}
