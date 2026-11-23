import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { loadArchive } from '../src/lib/content.js';
import { importHtmlDocument } from '../src/lib/html-import.js';
import { PNG, repoRoot } from './helpers.js';

const samplePath = path.join(repoRoot, 'tests/fixtures/sample-document.html');

describe('html import', () => {
  it('extracts the body and drops document styles, scripts, and unsafe urls', () => {
    const html = importHtmlDocument(fs.readFileSync(samplePath, 'utf8'));
    assert.match(html, /<h2>导入后的小节<\/h2>/);
    assert.match(html, /<strong>粗体<\/strong>/);
    assert.match(html, /<em>强调<\/em>/);
    assert.match(html, /<li>导入列表<\/li>/);
    assert.match(html, /<blockquote>[\s\S]*导入引语/);
    assert.match(html, /href="https:\/\/example\.com\/story"/);
    assert.match(html, /src="https:\/\/example\.com\/remote\.png"/);
    assert.match(html, /src="\.\/local\.png"/);
    assert.match(html, /BODY_KEEP/);
    assert.doesNotMatch(html, /<head/i);
    assert.doesNotMatch(html, /<style/i);
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /<iframe/i);
    assert.doesNotMatch(html, /<form/i);
    assert.doesNotMatch(html, /<input/i);
    assert.doesNotMatch(html, /BODY_COLOR_SECRET/);
    assert.doesNotMatch(html, /HEAD_SCRIPT_SECRET/);
    assert.doesNotMatch(html, /IFRAME_SECRET/);
    assert.doesNotMatch(html, /javascript:/i);
    assert.doesNotMatch(html, /onclick/i);
    assert.doesNotMatch(html, /不要保留的文档标题/);
  });

  it('writes markdown the site pipeline can publish', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-import-'));
    const content = path.join(dir, 'content');
    const sourceDir = path.join(content, 'example-alpha');
    fs.mkdirSync(sourceDir, { recursive: true });
    const out = path.join(sourceDir, '2026-01-15-imported-note.md');
    fs.writeFileSync(path.join(sourceDir, 'local.png'), PNG);
    const result = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/import-html.mjs'),
      '--html', samplePath,
      '--source', 'example-alpha',
      '--slug', 'imported-note',
      '--title', '【示例·虚构】导入的文档',
      '--published', '2026-01-15T08:30:00+08:00',
      '--summary', '虚构导入示例',
      '--lang', 'zh-CN',
      '--out', out,
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const archive = loadArchive(content);
    const item = archive.items[0];
    assert.equal(item.slug, 'imported-note');
    assert.match(item.html, /<h2>导入后的小节<\/h2>/);
    assert.match(item.html, /<strong>粗体<\/strong>/);
    assert.match(item.html, /<li>导入列表<\/li>/);
    assert.doesNotMatch(item.html, /<h1\b/);
    assert.match(item.html, /src="\/fresh-reads\/media\/example-alpha\/local\.png"/);
    assert.match(item.feedHtml, /src="https:\/\/yorks0n\.github\.io\/fresh-reads\/media\/example-alpha\/local\.png"/);
    assert.doesNotMatch(item.feedHtml, /javascript:/i);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects bad metadata and missing arguments', () => {
    const bad = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/import-html.mjs'),
      '--html', samplePath,
      '--source', 'example-alpha',
      '--slug', 'imported-note',
      '--title', '【示例·虚构】导入的文档',
      '--published', '2026-01-15T08:30:00Z',
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.notEqual(bad.status, 0);
    assert.match(bad.stderr, /\+08:00/);

    const missing = spawnSync(process.execPath, [
      path.join(repoRoot, 'scripts/import-html.mjs'),
      '--html', samplePath,
    ], { cwd: repoRoot, encoding: 'utf8' });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /用法/);
  });
});
