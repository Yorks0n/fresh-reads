import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { DOMParser } from '@xmldom/xmldom';
import { doc, fixtureRoot, repoRoot } from './helpers.js';

function runBuild(contentDir, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  return spawnSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CONTENT_DIR: contentDir,
      OUT_DIR: outDir,
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    encoding: 'utf8',
  });
}

function outputOf(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
}

function assertBuild(contentDir, outDir) {
  const result = runBuild(contentDir, outDir);
  assert.equal(result.status, 0, outputOf(result).split('\n').slice(-80).join('\n'));
}

function read(outDir, rel) {
  const abs = path.join(outDir, rel);
  assert.ok(fs.existsSync(abs), `missing ${rel}\n${fs.readdirSync(outDir).join(', ')}`);
  return fs.readFileSync(abs, 'utf8');
}

function parseXml(xml) {
  const errors = [];
  const doc = new DOMParser({
    onError(level, message) {
      if (level !== 'warning') errors.push(`${level}: ${message}`);
    },
  }).parseFromString(xml, 'text/xml');
  assert.deepEqual(errors, []);
  return doc;
}

describe('astro build output', { concurrency: 1 }, () => {
  it('publishes fixture pages and feeds with base paths, semantics, and stable guids', { timeout: 180000 }, () => {
    const outDir = path.join(repoRoot, 'test-dist');
    assertBuild(fixtureRoot, outDir);

    const home = read(outDir, 'index.html');
    const article = read(outDir, 'p/example-alpha/fictional-digest/index.html');
    const sourcePage = read(outDir, 'sources/example-alpha/index.html');
    const all = read(outDir, 'feeds/all.xml');
    const alpha = read(outDir, 'feeds/example-alpha.xml');
    const beta = read(outDir, 'feeds/example-beta.xml');
    const prose = article.slice(article.indexOf('class="prose"'), article.indexOf('</article>'));

    assert.match(home, /href="\/fresh-reads\/"/);
    assert.match(home, /href="\/fresh-reads\/archive\/"/);
    assert.match(home, /href="\/fresh-reads\/sources\/"/);
    assert.match(home, /href="\/fresh-reads\/feeds\/all\.xml"/);
    assert.match(home, /https:\/\/yorks0n\.github\.io\/fresh-reads\/feeds\/all\.xml/);
    assert.match(home, /rel="alternate" type="application\/rss\+xml"/);
    assert.match(home, /color-scheme/);
    assert.doesNotMatch(home, /href="\/(?!fresh-reads\/)[^"]+\.css"/);
    assert.ok(home.indexOf('【示例·虚构】贝塔摘录') < home.indexOf('【示例·虚构】阿尔法摘录'));
    assert.doesNotMatch(home, /<script/i);
    assert.doesNotMatch(home, /\/fresh-reads\/fresh-reads/);

    assert.match(article, /rel="canonical" href="https:\/\/yorks0n\.github\.io\/fresh-reads\/p\/example-alpha\/fictional-digest\/"/);
    assert.equal(article.match(/<h1\b/g)?.length, 1);
    assert.match(article, /<h1>【示例·虚构】阿尔法摘录<\/h1>/);
    assert.match(prose, /<h2>虚构小节<\/h2>/);
    assert.match(prose, /<strong>粗体<\/strong>/);
    assert.match(prose, /<li>列表甲<\/li>/);
    assert.match(prose, /<blockquote>/);
    assert.match(prose, /src="\/fresh-reads\/media\/example-alpha\/pixel\.png"/);
    assert.match(prose, /src="https:\/\/example\.com\/remote\.png"/);
    assert.doesNotMatch(prose, /<h1\b/);
    assert.doesNotMatch(prose, /<script/i);
    assert.doesNotMatch(prose, /javascript:/i);
    assert.doesNotMatch(prose, /onclick/i);
    assert.doesNotMatch(prose, /onerror/i);
    assert.doesNotMatch(prose, /style=/i);
    assert.doesNotMatch(article, /href="\/p\//);
    assert.doesNotMatch(article, /href="\/feeds\//);
    assert.doesNotMatch(article, /href="\/archive/);
    assert.doesNotMatch(article, /href="\/sources\//);
    assert.doesNotMatch(article, /\/fresh-reads\/fresh-reads/);

    assert.match(sourcePage, /订阅此来源全文/);
    assert.equal(sourcePage.includes('贝塔虚构句子'), false);

    for (const xml of [all, alpha, beta]) {
      parseXml(xml);
      assert.doesNotMatch(xml, /\/fresh-reads\/fresh-reads/);
      assert.doesNotMatch(xml, /<script/i);
      assert.doesNotMatch(xml, /javascript:/i);
    }
    assert.match(all, /【示例·虚构】阿尔法摘录/);
    assert.match(all, /【示例·虚构】贝塔摘录/);
    assert.match(all, /<guid isPermaLink="false">tag:yorks0n\.github\.io,2026:fresh-reads\/example-alpha\/fictional-digest<\/guid>/);
    assert.match(all, /https:\/\/yorks0n\.github\.io\/fresh-reads\/p\/example-alpha\/fictional-digest\//);
    assert.match(all, /https:\/\/yorks0n\.github\.io\/fresh-reads\/media\/example-alpha\/pixel\.png/);
    assert.match(all, /https:\/\/example\.com\/remote\.png/);
    assert.doesNotMatch(all, /\.\/pixel\.png/);
    assert.match(alpha, /阿尔法虚构句子/);
    assert.equal(alpha.includes('贝塔虚构句子'), false);
    assert.match(beta, /贝塔虚构句子/);
    assert.equal(beta.includes('阿尔法虚构句子'), false);
    assert.equal(parseXml(alpha).getElementsByTagName('item').length, 1);
    assert.equal(parseXml(beta).getElementsByTagName('item').length, 1);

    const image = path.join(outDir, 'media/example-alpha/pixel.png');
    assert.ok(fs.existsSync(image));
    assert.ok(fs.statSync(image).size > 0);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('builds an empty production archive', { timeout: 180000 }, () => {
    const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-empty-'));
    const outDir = path.join(repoRoot, 'test-dist-empty');
    try {
      assertBuild(contentDir, outDir);
      const home = read(outDir, 'index.html');
      const feed = read(outDir, 'feeds/all.xml');
      assert.match(home, /还没有文章/);
      assert.match(home, /href="\/fresh-reads\/feeds\/all\.xml"/);
      assert.match(home, /color-scheme/);
      assert.doesNotMatch(home, /href="\/(?!fresh-reads\/)[^"]+\.css"/);
      assert.doesNotMatch(home, /\/fresh-reads\/fresh-reads/);
      assert.equal(parseXml(feed).getElementsByTagName('item').length, 0);
      assert.equal(fs.existsSync(path.join(outDir, 'feeds/example-alpha.xml')), false);
    } finally {
      fs.rmSync(contentDir, { recursive: true, force: true });
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('fails the site build when metadata is invalid', { timeout: 180000 }, () => {
    const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-bad-'));
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh-reads-bad-out-'));
    fs.mkdirSync(path.join(contentDir, 'example-alpha'), { recursive: true });
    fs.writeFileSync(
      path.join(contentDir, 'example-alpha/2026-01-15-bad.md'),
      doc({ published: '2026-01-15T08:30:00Z', slug: 'bad' }).markdown,
    );
    try {
      const result = runBuild(contentDir, outDir);
      assert.notEqual(result.status, 0);
      const output = outputOf(result);
      assert.match(output, /内容校验失败/);
      assert.match(output, /2026-01-15-bad\.md/);
      assert.match(output, /\+08:00/);
    } finally {
      fs.rmSync(contentDir, { recursive: true, force: true });
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});
