const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

export const relativeTime = (value) => {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return '';

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));

  if (seconds < 45) return 'just now';
  if (seconds < MINUTE * 2) return 'a minute ago';
  if (seconds < HOUR) return `${Math.round(seconds / MINUTE)} min ago`;
  if (seconds < HOUR * 2) return 'an hour ago';
  if (seconds < DAY) return `${Math.round(seconds / HOUR)} hours ago`;
  if (seconds < DAY * 2) return 'yesterday';
  if (seconds < DAY * 7) return `${Math.round(seconds / DAY)} days ago`;

  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
