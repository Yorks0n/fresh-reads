import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { importHtmlDocument, markdownFromImport } from '../src/lib/html-import.js';
import { validateData } from '../src/lib/metadata.js';

const HELP = `用法
  node scripts/import-html.mjs --html 文件.html --source 来源 --slug 永久id --title 标题 --published 2026-01-15T08:30:00+08:00 [--summary 摘要] [--lang zh-CN] [--updated 时间] [--out 输出.md]

从完整 HTML 中抽出 body，去掉 head、样式表和脚本，再消毒成可以放进 Markdown 的片段。
不保留原页面的 CSS。站点构建时会再用同一套规则消毒一次。
输出文件名应为 content/<source>/YYYY-MM-DD-<slug>.md。图片用相对路径，和 Markdown 放在同一内容目录里。
`;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

const { values } = parseArgs({
  options: {
    html: { type: 'string' },
    out: { type: 'string' },
    source: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    published: { type: 'string' },
    updated: { type: 'string' },
    summary: { type: 'string' },
    lang: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
  strict: true,
});

if (values.help) {
  process.stdout.write(HELP);
} else if (!values.html || !values.source || !values.slug || !values.title || !values.published) {
  fail(HELP);
} else if (!fs.existsSync(values.html)) {
  fail(`找不到 HTML 文件：${values.html}`);
} else {
  const meta = {
    title: values.title,
    source: values.source,
    published: values.published,
    slug: values.slug,
  };
  if (values.updated) meta.updated = values.updated;
  if (values.summary) meta.summary = values.summary;
  if (values.lang) meta.lang = values.lang;
  const rel = `${values.source}/${values.published.slice(0, 10)}-${values.slug}.md`;
  const { problems } = validateData(meta, rel);
  const expectedName = `${values.published.slice(0, 10)}-${values.slug}.md`;
  if (problems.length > 0) {
    fail(problems.map((item) => `- ${item}`).join('\n'));
  } else if (values.out && path.basename(values.out) !== expectedName) {
    fail(`输出文件名必须是 ${expectedName}，收到 ${path.basename(values.out)}`);
  } else {
    const html = importHtmlDocument(fs.readFileSync(values.html, 'utf8'));
    const markdown = markdownFromImport(meta, html);
    if (values.out) {
      fs.mkdirSync(path.dirname(path.resolve(values.out)), { recursive: true });
      fs.writeFileSync(values.out, markdown);
      process.stdout.write(`已写入 ${values.out}\n`);
    } else {
      process.stdout.write(markdown);
    }
  }
}
