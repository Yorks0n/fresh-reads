export const SITE_ORIGIN = 'https://yorks0n.github.io';
export const BASE_PATH = '/fresh-reads';
export const SITE_NAME = '新鲜事儿';
export const SITE_DESCRIPTION = '每日阅读的全文存档，供 RSS 阅读器订阅。';

// The year in this tag URI is when the id scheme was defined. It is not the
// article year. Changing it would mint a new guid for every existing item.
export const GUID_PREFIX = 'tag:yorks0n.github.io,2026:fresh-reads';

export const HOME_LIMIT = 30;

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);

export function itemGuid(source, slug) {
  return `${GUID_PREFIX}/${source}/${slug}`;
}

export function withBase(pathname) {
  if (!pathname.startsWith('/')) {
    throw new Error(`站内路径必须以 / 开头：${pathname}`);
  }
  if (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`)) return pathname;
  return `${BASE_PATH}${pathname}`;
}

export function absoluteUrl(pathname) {
  return `${SITE_ORIGIN}${withBase(pathname)}`;
}

export function itemPath(source, slug) {
  return `/p/${source}/${slug}/`;
}
