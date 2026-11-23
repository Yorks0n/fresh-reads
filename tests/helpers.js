import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(here, '..');
export const fixtureRoot = path.join(repoRoot, 'tests/fixtures/content');

export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export function withContent(files, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-'));
  try {
    for (const [rel, contents] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, contents);
    }
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function doc(overrides = {}, body = '虚构正文，不是真实新闻。\n') {
  const data = {
    title: '【示例·虚构】标题',
    source: 'example-alpha',
    published: '2026-01-15T08:30:00+08:00',
    slug: 'fictional-digest',
    ...overrides,
  };
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) lines.push(`${key}: ${JSON.stringify(value)}`);
  lines.push('---', '', body);
  return { data, markdown: lines.join('\n') };
}

export function relFor(data) {
  const day = String(data.published ?? '2026-01-15').slice(0, 10);
  const slug = data.slug ?? data.id ?? 'note';
  return `${data.source ?? 'example-alpha'}/${day}-${slug}.md`;
}
