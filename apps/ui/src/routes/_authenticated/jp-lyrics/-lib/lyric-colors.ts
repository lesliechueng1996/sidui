import { cn } from '@/lib/utils';
import type { LyricColorToken } from './lyric';

export const LYRIC_COLOR_LABELS: Record<LyricColorToken, string> = {
  rose: '玫红',
  amber: '琥珀',
  lime: '青绿',
  sky: '天蓝',
  violet: '紫罗兰',
  pink: '粉',
  orange: '橙',
  teal: '青绿蓝',
};

const LYRIC_COLOR_CLASSES: Record<LyricColorToken, string> = {
  rose: 'bg-rose-200 text-rose-950 dark:bg-rose-900/70 dark:text-rose-50',
  amber: 'bg-amber-200 text-amber-950 dark:bg-amber-900/70 dark:text-amber-50',
  lime: 'bg-lime-200 text-lime-950 dark:bg-lime-900/70 dark:text-lime-50',
  sky: 'bg-sky-200 text-sky-950 dark:bg-sky-900/70 dark:text-sky-50',
  violet:
    'bg-violet-200 text-violet-950 dark:bg-violet-900/70 dark:text-violet-50',
  pink: 'bg-pink-200 text-pink-950 dark:bg-pink-900/70 dark:text-pink-50',
  orange:
    'bg-orange-200 text-orange-950 dark:bg-orange-900/70 dark:text-orange-50',
  teal: 'bg-teal-200 text-teal-950 dark:bg-teal-900/70 dark:text-teal-50',
};

export const lyricColorClassName = (
  color: LyricColorToken | null,
  extra?: string,
): string =>
  cn(
    'rounded-sm px-0.5',
    color ? LYRIC_COLOR_CLASSES[color] : undefined,
    extra,
  );
