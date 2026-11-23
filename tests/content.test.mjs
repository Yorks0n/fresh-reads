import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { loadArchive } from '../src/lib/content.js';
import { doc, fixtureRoot, PNG, repoRoot, withContent } from './helpers.js';

function failure(run) {
  try {
    const archive = run();
    assert.fail(`expected content to fail, got ${archive.items.length} items`);
  } catch (error) {
    assert.equal(error.name, 'ContentError');
    return error.message;
  }
}

describe('content metadata', { concurrency: 1 }, () => {
  it('loads an empty directory and the repository content folder', () => {
    withContent({}, (dir) => {
      const archive = loadArchive(dir);
      assert.deepEqual(archive.items, []);
      assert.deepEqual(archive.media, []);
    });
    const archive = loadArchive(path.join(repoRoot, 'content'));
    assert.ok(Array.isArray(archive.items));
  });

  it('names the file when required metadata is missing or mistyped', () => {
    const message = failure(() => withContent({
      'example-alpha/2026-01-15-missing-title.md': doc({ title: undefined, slug: 'missing-title' }).markdown,
      'example-alpha/2026-01-15-zulu.md': doc({ published: '2026-01-15T08:30:00Z', slug: 'zulu' }).markdown,
      'example-alpha/2026-01-15-date-only.md': doc({ published: '2026-01-15', slug: 'date-only' }).markdown,
      'example-alpha/2026-01-15-mismatch.md': doc({ source: 'other-source', slug: 'mismatch' }).markdown,
      'example-alpha/2026-01-15-secret-field.md': doc({ secret: 'nope', slug: 'secret-field' }).markdown,
      'example-alpha/2026-01-15-early.md': doc({ updated: '2026-01-15T07:00:00+08:00', slug: 'early' }).markdown,
      'example-alpha/2026-02-31-impossible.md': doc({ published: '2026-02-31T00:00:00+08:00', slug: 'impossible' }).markdown,
      'example-alpha/note.md': doc({ slug: 'note' }).markdown,
      'example-alpha/2026-01-15-other.md': doc({ slug: 'fictional-digest' }).markdown,
      'example-alpha/extra/2026-01-15-nested.md': doc({ slug: 'nested' }).markdown,
      'example-alpha/page.mdx': '---\ntitle: "x"\n---\n',
    }, loadArchive));

    assert.match(message, /内容校验失败/);
    assert.match(message, /必须提供 title/);
    assert.match(message, /\+08:00/);
    assert.match(message, /不能用 Z 或其他时区/);
    assert.match(message, /2026-01-15-date-only\.md/);
    assert.match(message, /source 必须与目录名一致/);
    assert.match(message, /未知字段 secret/);
    assert.match(message, /updated 不能早于 published/);
    assert.match(message, /不是有效的 \+08:00 日历时间/);
    assert.match(message, /note\.md: 文件名必须是 YYYY-MM-DD\.md 或 YYYY-MM-DD-<slug>\.md/);
    assert.match(message, /文件名中的 slug（other）必须与 frontmatter 的 slug 相同/);
    assert.match(message, /不能放在子目录/);
    assert.match(message, /不支持 MDX/);
  });

  it('rejects duplicate slugs and accepts the same slug in another source', () => {
    const duplicate = failure(() => withContent({
      'example-alpha/2026-01-15-same.md': doc({ slug: 'same' }).markdown,
      'example-alpha/2026-01-16-same.md': doc({ slug: 'same', published: '2026-01-16T08:30:00+08:00' }).markdown,
    }, loadArchive));
    assert.match(duplicate, /重复的 slug「same」/);
    assert.match(duplicate, /2026-01-15-same\.md/);
    assert.match(duplicate, /2026-01-16-same\.md/);

    const archive = withContent({
      'example-alpha/2026-01-15-same.md': doc({ slug: 'same' }).markdown,
      'example-beta/2026-01-15-same.md': doc({ source: 'example-beta', slug: 'same' }).markdown,
    }, loadArchive);
    assert.equal(archive.items.length, 2);
    assert.deepEqual(archive.items.map((item) => item.guid).sort(), [
      'tag:yorks0n.github.io,2026:fresh-reads/example-alpha/same',
      'tag:yorks0n.github.io,2026:fresh-reads/example-beta/same',
    ]);
  });

  it('treats slug and id as one permanent id', () => {
    const conflict = failure(() => withContent({
      'example-alpha/2026-01-15-fictional-digest.md': doc({ id: 'other-id' }).markdown,
    }, loadArchive));
    assert.match(conflict, /slug 与 id 必须相同/);

    const archive = withContent({
      'example-alpha/2026-01-15-only-id.md': doc({ slug: undefined, id: 'only-id' }).markdown,
    }, loadArchive);
    assert.equal(archive.items[0].slug, 'only-id');
    assert.equal(archive.items[0].path, '/p/example-alpha/only-id/');
  });

  it('rejects a missing local image, an unsupported type, and a path that escapes content', () => {
    const missing = failure(() => withContent({
      'example-alpha/2026-01-15-fictional-digest.md': doc({}, '![图](./missing.png)\n').markdown,
    }, loadArchive));
    assert.match(missing, /找不到图片：\.\/missing\.png/);

    const svg = failure(() => withContent({
      'example-alpha/2026-01-15-fictional-digest.md': doc({}, '![图](./diagram.svg)\n').markdown,
      'example-alpha/diagram.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    }, loadArchive));
    assert.match(svg, /不支持的图片类型 \.svg/);

    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-outside-'));
    const outside = path.join(parent, 'secret.png');
    const contentDir = path.join(parent, 'content');
    fs.mkdirSync(path.join(contentDir, 'example-alpha'), { recursive: true });
    fs.writeFileSync(outside, PNG);
    fs.writeFileSync(
      path.join(contentDir, 'example-alpha/2026-01-15-fictional-digest.md'),
      doc({}, '![图](../../secret.png)\n').markdown,
    );
    try {
      const escaped = failure(() => loadArchive(contentDir));
      assert.match(escaped, /图片必须位于内容目录内/);
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

  it('fails clearly when CONTENT_DIR does not exist', () => {
    const previous = process.env.CONTENT_DIR;
    process.env.CONTENT_DIR = path.join(repoRoot, 'missing-content-dir');
    try {
      const message = failure(() => loadArchive());
      assert.match(message, /CONTENT_DIR 不存在/);
    } finally {
      if (previous === undefined) delete process.env.CONTENT_DIR;
      else process.env.CONTENT_DIR = previous;
    }
  });

  it('keeps fixture content out of the default loader unless CONTENT_DIR points at it', () => {
    const previous = process.env.CONTENT_DIR;
    delete process.env.CONTENT_DIR;
    try {
      const archive = loadArchive();
      assert.equal(archive.items.some((item) => item.title.includes('【示例·虚构】')), false);
      assert.equal(path.basename(fixtureRoot), 'content');
    } finally {
      if (previous === undefined) delete process.env.CONTENT_DIR;
      else process.env.CONTENT_DIR = previous;
    }
  });
});
