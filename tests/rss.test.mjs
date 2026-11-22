import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DOMParser } from '@xmldom/xmldom';
import { loadArchive } from '../src/lib/content.js';
import { renderFeed } from '../src/lib/rss.js';
import { itemGuid, SITE_NAME } from '../src/lib/site.js';
import { doc, fixtureRoot, withContent } from './helpers.js';

function parseXml(xml) {
  const errors = [];
  const doc = new DOMParser({
    onError(level, message) {
      if (level !== 'warning') errors.push(`${level}: ${message}`);
    },
  }).parseFromString(xml, 'text/xml');
  assert.deepEqual(errors, [], xml);
  return doc;
}

function itemTexts(doc, tagName) {
  return [...doc.getElementsByTagName(tagName)].map((node) => node.textContent);
}

describe('full-text RSS', () => {
  it('builds a valid all-feed and one feed per source from the same sanitized body', () => {
    const archive = loadArchive(fixtureRoot);
    const all = renderFeed({ title: SITE_NAME, selfPath: '/feeds/all.xml', items: archive.items });
    const alphaItems = archive.items.filter((item) => item.source === 'example-alpha');
    const betaItems = archive.items.filter((item) => item.source === 'example-beta');
    const alpha = renderFeed({
      title: `${SITE_NAME} · example-alpha`,
      selfPath: '/feeds/example-alpha.xml',
      items: alphaItems,
    });
    const beta = renderFeed({
      title: `${SITE_NAME} · example-beta`,
      selfPath: '/feeds/example-beta.xml',
      items: betaItems,
    });

    const allDoc = parseXml(all);
    const alphaDoc = parseXml(alpha);
    const betaDoc = parseXml(beta);
    assert.equal(allDoc.getElementsByTagName('item').length, 2);
    assert.equal(alphaDoc.getElementsByTagName('item').length, 1);
    assert.equal(betaDoc.getElementsByTagName('item').length, 1);
    const itemTitle = (doc) => [...doc.getElementsByTagName('item')].map((item) => item.getElementsByTagName('title')[0].textContent);
    assert.deepEqual(itemTitle(alphaDoc), ['【示例·虚构】阿尔法摘录']);
    assert.deepEqual(itemTitle(betaDoc), ['【示例·虚构】贝塔摘录']);
    assert.equal(beta.includes('阿尔法虚构句子'), false);
    assert.equal(alpha.includes('贝塔虚构句子'), false);

    const encoded = [...allDoc.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')]
      .map((node) => node.textContent)
      .join('\n');
    const descriptions = itemTexts(allDoc, 'description').join('\n');
    for (const body of [encoded, descriptions]) {
      assert.match(body, /阿尔法虚构句子/);
      assert.match(body, /<strong>粗体<\/strong>/);
      assert.match(body, /<li>列表甲<\/li>/);
      assert.match(body, /https:\/\/yorks0n\.github\.io\/fresh-reads\/media\/example-alpha\/pixel\.png/);
      assert.match(body, /https:\/\/example\.com\/remote\.png/);
      assert.match(body, /https:\/\/yorks0n\.github\.io\/fresh-reads\/archive\//);
      assert.doesNotMatch(body, /\.\/pixel\.png/);
      assert.doesNotMatch(body, /javascript:/i);
      assert.doesNotMatch(body, /<script/i);
    }

    assert.match(all, /<link>https:\/\/yorks0n\.github\.io\/fresh-reads\/<\/link>/);
    assert.match(all, /<atom:link href="https:\/\/yorks0n\.github\.io\/fresh-reads\/feeds\/all\.xml" rel="self"/);
    assert.match(alpha, /<atom:link href="https:\/\/yorks0n\.github\.io\/fresh-reads\/feeds\/example-alpha\.xml" rel="self"/);
    assert.match(all, /<guid isPermaLink="false">tag:yorks0n\.github\.io,2026:fresh-reads\/example-alpha\/fictional-digest<\/guid>/);
    assert.match(all, /<pubDate>Thu, 15 Jan 2026 08:30:00 \+0800<\/pubDate>/);
    assert.match(all, /<atom:updated>2026-01-15T09:45:00\+08:00<\/atom:updated>/);
    assert.match(all, /<lastBuildDate>Fri, 16 Jan 2026 08:00:00 \+0800<\/lastBuildDate>/);
    assert.doesNotMatch(all, /\/fresh-reads\/fresh-reads/);
    assert.equal(
      alphaItems[0].guid,
      'tag:yorks0n.github.io,2026:fresh-reads/example-alpha/fictional-digest',
    );
  });

  it('keeps the guid and permalink when the body and updated time change', () => {
    const first = withContent({
      'example-alpha/2026-01-15-stable-note.md': doc({
        slug: 'stable-note',
        title: '【示例·虚构】稳定修订',
      }, '第一版虚构正文。\n').markdown,
    }, loadArchive).items[0];
    const second = withContent({
      'example-alpha/2026-01-15-stable-note.md': doc({
        slug: 'stable-note',
        title: '【示例·虚构】稳定修订',
        updated: '2026-01-20T12:00:00+08:00',
      }, '第二版虚构正文。\n').markdown,
    }, loadArchive).items[0];

    assert.equal(first.guid, second.guid);
    assert.equal(first.guid, itemGuid('example-alpha', 'stable-note'));
    assert.equal(first.path, second.path);
    assert.notEqual(first.feedHtml, second.feedHtml);

    const before = renderFeed({ title: SITE_NAME, selfPath: '/feeds/all.xml', items: [first] });
    const after = renderFeed({ title: SITE_NAME, selfPath: '/feeds/all.xml', items: [second] });
    assert.equal(itemTexts(parseXml(before), 'guid').join(), itemTexts(parseXml(after), 'guid').join());
    assert.equal(itemTexts(parseXml(before), 'link').join(), itemTexts(parseXml(after), 'link').join());
    assert.match(before, /第一版虚构正文/);
    assert.match(after, /第二版虚构正文/);
    assert.equal(after.includes('第一版虚构正文'), false);
    assert.match(before, /<pubDate>Thu, 15 Jan 2026 08:30:00 \+0800<\/pubDate>/);
    assert.match(after, /<pubDate>Thu, 15 Jan 2026 08:30:00 \+0800<\/pubDate>/);
    assert.match(after, /<atom:updated>2026-01-20T12:00:00\+08:00<\/atom:updated>/);
    assert.notEqual(itemGuid('example-alpha', 'stable-note'), itemGuid('example-alpha', 'other-note'));
  });

  it('escapes xml and survives a cdata terminator', () => {
    const xml = renderFeed({
      title: 'A & B',
      selfPath: '/feeds/all.xml',
      items: [{
        title: 'A & B <C>',
        source: 'example-alpha',
        slug: 'amp',
        published: '2026-01-15T08:30:00+08:00',
        updated: null,
        feedHtml: '<p>a]]>b</p>',
      }],
    });
    const doc = parseXml(xml);
    assert.equal(doc.getElementsByTagName('title')[1].textContent, 'A & B <C>');
    assert.match(
      doc.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0].textContent,
      /a]]>b/,
    );
  });

  it('emits a valid empty feed', () => {
    const xml = renderFeed({ title: SITE_NAME, selfPath: '/feeds/all.xml', items: [] });
    const doc = parseXml(xml);
    assert.equal(doc.getElementsByTagName('item').length, 0);
    assert.equal(doc.getElementsByTagName('lastBuildDate').length, 0);
    assert.match(xml, /https:\/\/yorks0n\.github\.io\/fresh-reads\/feeds\/all\.xml/);
    assert.doesNotMatch(xml, /\/fresh-reads\/fresh-reads/);
  });
});
