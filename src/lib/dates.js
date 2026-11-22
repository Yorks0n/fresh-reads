const TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+08:00$/;

function partsInShanghai(date, locale, options) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Shanghai',
    hourCycle: 'h23',
    ...options,
  }).formatToParts(date);
}

function part(parts, type) {
  const found = parts.find((item) => item.type === type);
  if (!found) throw new Error(`无法格式化时间字段 ${type}`);
  return found.value;
}

export function formatOffset(date) {
  const pieces = partsInShanghai(date, 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${part(pieces, 'year')}-${part(pieces, 'month')}-${part(pieces, 'day')}T${part(pieces, 'hour')}:${part(pieces, 'minute')}:${part(pieces, 'second')}+08:00`;
}

export function timestampProblem(value, field) {
  if (typeof value !== 'string' || !TIMESTAMP.test(value)) {
    return `${field} 必须是 YYYY-MM-DDTHH:mm:ss+08:00（必须写明 +08:00，不能用 Z 或其他时区）`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return `${field} 不是有效时间：${value}`;
  const roundTrip = formatOffset(parsed);
  if (roundTrip !== value) return `${field} 不是有效的 +08:00 日历时间：${value}`;
  return null;
}

export function rfc822(iso) {
  const pieces = partsInShanghai(new Date(iso), 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${part(pieces, 'weekday')}, ${part(pieces, 'day')} ${part(pieces, 'month')} ${part(pieces, 'year')} ${part(pieces, 'hour')}:${part(pieces, 'minute')}:${part(pieces, 'second')} +0800`;
}

export function formatDisplay(iso) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function monthLabel(key) {
  const [year, month] = key.split('-');
  return `${year}年${Number(month)}月`;
}
