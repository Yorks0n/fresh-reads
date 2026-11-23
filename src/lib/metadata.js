import { load as loadYaml, FAILSAFE_SCHEMA } from 'js-yaml';
import { timestampProblem } from './dates.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_RE = /^(\d{4}-\d{2}-\d{2})(?:-([a-z0-9]+(?:-[a-z0-9]+)*))?\.md$/;
const LANG_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const ALLOWED_KEYS = new Set(['title', 'source', 'published', 'slug', 'id', 'updated', 'summary', 'lang']);

export function isSlug(value) {
  return SLUG_RE.test(value);
}

export class ContentError extends Error {
  constructor(problems) {
    const list = (Array.isArray(problems) ? problems : [String(problems)]).filter(Boolean);
    super(`内容校验失败（${list.length}）：\n${list.map((item) => `- ${item}`).join('\n')}`);
    this.name = 'ContentError';
    this.problems = list;
  }
}

export function failContent(problems) {
  throw new ContentError(problems);
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function splitFrontmatter(source) {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!text.startsWith('---\n')) {
    throw new Error('缺少 frontmatter，文件必须以 --- 开头');
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error('frontmatter 没有结束的 ---');
  const after = text.slice(end + 4);
  if (after.length > 0 && !after.startsWith('\n')) {
    throw new Error('frontmatter 的结束标记 --- 必须单独成行');
  }
  const yamlText = text.slice(4, end);
  const body = after.startsWith('\n') ? after.slice(1) : after;
  let data;
  try {
    // FAILSAFE keeps timestamps as text. Default YAML would turn them into Date
    // and drop the explicit +08:00 offset.
    data = loadYaml(yamlText, { schema: FAILSAFE_SCHEMA });
  } catch (error) {
    throw new Error(`frontmatter YAML 无法解析：${error.message}`);
  }
  if (data == null) data = {};
  return { data, body };
}

export function validateData(data, relPath) {
  const problems = [];
  const fail = (message) => problems.push(`${relPath}: ${message}`);
  if (!isPlainObject(data)) {
    fail('frontmatter 必须是键值对');
    return problems;
  }

  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) fail(`未知字段 ${key}`);
    else if (data[key] != null && typeof data[key] !== 'string') fail(`${key} 必须是字符串`);
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) fail('必须提供 title');
  else {
    if (title.length > 200) fail('title 不能超过 200 个字符');
    if (/[\u0000-\u001F]/.test(data.title)) fail('title 不能包含换行或控制字符');
  }

  const parts = relPath.split('/');
  const sourceDir = parts.length === 2 ? parts[0] : '';
  const filename = parts.at(-1) ?? '';
  if (parts.length !== 2) fail('Markdown 必须放在 content/<source>/ 下，不能放在子目录或其他位置');

  if (typeof data.source !== 'string' || !data.source) fail('必须提供 source');
  else if (sourceDir && data.source !== sourceDir) fail(`source 必须与目录名一致（${sourceDir}）`);

  const slugValue = typeof data.slug === 'string' ? data.slug : '';
  const idValue = typeof data.id === 'string' ? data.id : '';
  if (slugValue && idValue && slugValue !== idValue) {
    fail('slug 与 id 必须相同，它们是同一个永久 id');
  }
  const slug = slugValue || idValue;
  if (!slug) fail('必须提供 slug（永久 id）');
  else if (!SLUG_RE.test(slug)) fail('slug 只能使用小写字母、数字和短横线，且不能以短横线开头或结尾');

  const publishedError = typeof data.published === 'string' && data.published !== ''
    ? timestampProblem(data.published, 'published')
    : '必须提供 published';
  if (publishedError) fail(publishedError);

  let updated = null;
  if (typeof data.updated === 'string' && data.updated !== '') {
    const updatedError = timestampProblem(data.updated, 'updated');
    if (updatedError) fail(updatedError);
    else if (!publishedError && data.updated < data.published) fail('updated 不能早于 published');
    else updated = data.updated;
  }

  let summary = null;
  if (typeof data.summary === 'string' && data.summary.trim() !== '') {
    summary = data.summary.trim();
    if (summary.length > 400) fail('summary 不能超过 400 个字符');
    if (/[<>]/.test(summary)) fail('summary 只能是纯文本');
  }

  let lang = null;
  if (typeof data.lang === 'string' && data.lang !== '') {
    if (!LANG_RE.test(data.lang)) fail('lang 需要是 BCP 47 语言标签，例如 zh-CN');
    else lang = data.lang;
  }

  if (filename.endsWith('.mdx')) fail('不支持 MDX，请使用普通 Markdown');
  const fileMatch = FILE_RE.exec(filename);
  if (!filename.endsWith('.mdx')) {
    if (!fileMatch) fail('文件名必须是 YYYY-MM-DD.md 或 YYYY-MM-DD-<slug>.md');
    else {
      if (!publishedError && typeof data.published === 'string' && fileMatch[1] !== data.published.slice(0, 10)) {
        fail(`文件名日期 ${fileMatch[1]} 必须等于 published 的日期 ${data.published.slice(0, 10)}`);
      }
      if (fileMatch[2] && slug && fileMatch[2] !== slug) {
        fail(`文件名中的 slug（${fileMatch[2]}）必须与 frontmatter 的 slug 相同`);
      }
    }
  }

  return {
    problems,
    value: problems.length === 0 ? {
      title,
      source: data.source,
      published: data.published,
      updated,
      slug,
      summary,
      lang,
    } : null,
  };
}

export function parseDocument(source, relPath) {
  try {
    const { data, body } = splitFrontmatter(source);
    const validated = validateData(data, relPath);
    return { ...validated, body };
  } catch (error) {
    return { problems: [`${relPath}: ${error.message}`], value: null, body: '' };
  }
}
