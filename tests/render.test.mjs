import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadArchive } from '../src/lib/content.js';
import { doc, fixtureRoot, PNG, withContent } from './helpers.js';

describe('rendered article html', () => {
  it('keeps semantic formatting, strips unsafe html, and removes a duplicate h1', () => {
    const archive = loadArchive(fixtureRoot);
    const item = archive.items.find((entry) => entry.slug === 'fictional-digest');
    const html = item.html;

    assert.match(html, /<h2>虚构小节<\/h2>/);
    assert.match(html, /<strong>粗体<\/strong>/);
    assert.match(html, /<em>强调<\/em>/);
    assert.match(html, /<li>列表甲<\/li>/);
    assert.match(html, /<li>列表乙<\/li>/);
    assert.match(html, /<blockquote>[\s\S]*虚构引语/);
    assert.match(html, /<code>行内代码<\/code>/);
    assert.match(html, /<pre><code>虚构代码/);
    assert.match(html, /<table>[\s\S]*列甲/);
    assert.match(html, /href="https:\/\/example\.com\/story"/);
    assert.match(html, /href="\/fresh-reads\/archive\/"/);
    assert.match(html, /src="\/fresh-reads\/media\/example-alpha\/pixel\.png"/);
    assert.match(html, /alt="虚构示意图"/);
    assert.match(html, /src="https:\/\/example\.com\/remote\.png"/);
    assert.match(html, /AT&amp;T/);
    assert.match(html, /带样式的句子/);
    assert.match(html, /<strong>仍应保留的粗体<\/strong>/);
    assert.match(html, /危险链接/);

    assert.doesNotMatch(html, /<h1\b/i);
    assert.doesNotMatch(html, /<img\b(?![^>]*\bsrc=)/i);
    assert.doesNotMatch(html, /<a\b(?![^>]*\bhref=)/i);
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /<style/i);
    assert.doesNotMatch(html, /<iframe/i);
    assert.doesNotMatch(html, /<form/i);
    assert.doesNotMatch(html, /<input/i);
    assert.doesNotMatch(html, /javascript:/i);
    assert.doesNotMatch(html, /vbscript:/i);
    assert.doesNotMatch(html, /data:/i);
    assert.doesNotMatch(html, /file:/i);
    assert.doesNotMatch(html, /onclick/i);
    assert.doesNotMatch(html, /onerror/i);
    assert.doesNotMatch(html, /style=/i);
    assert.doesNotMatch(html, /alert\(1\)/);
    assert.doesNotMatch(html, /display:\s*none/);
    assert.doesNotMatch(html, /IFRAME_SECRET/);
    assert.doesNotMatch(html, /\/\/evil\.example/);
    assert.doesNotMatch(html, /\.\/pixel\.png/);
    assert.doesNotMatch(html, /\/fresh-reads\/fresh-reads/);

    assert.equal(archive.media.some((media) => media.relPath === 'example-alpha/pixel.png'), true);
  });

  it('keeps a different first h1 because it is not the template title', () => {
    const archive = withContent({
      'example-alpha/2026-01-15-fictional-digest.md': doc({}, '# 另一虚构标题\n\n正文还在。\n').markdown,
    }, loadArchive);
    assert.match(archive.items[0].html, /<h1>另一虚构标题<\/h1>/);
    assert.match(archive.items[0].html, /正文还在。/);
  });

  it('resolves a relative image and leaves an https image untouched', () => {
    const archive = withContent({
      'example-alpha/2026-01-15-fictional-digest.md': doc(
        {},
        '![本地](./pixel.png)\n\n![远程](https://example.com/remote.png)\n',
      ).markdown,
      'example-alpha/pixel.png': PNG,
    }, loadArchive);
    const html = archive.items[0].html;
    assert.match(html, /src="\/fresh-reads\/media\/example-alpha\/pixel\.png"/);
    assert.match(html, /src="https:\/\/example\.com\/remote\.png"/);
    assert.match(archive.items[0].feedHtml, /src="https:\/\/yorks0n\.github\.io\/fresh-reads\/media\/example-alpha\/pixel\.png"/);
    assert.match(archive.items[0].feedHtml, /src="https:\/\/example\.com\/remote\.png"/);
  });
});
