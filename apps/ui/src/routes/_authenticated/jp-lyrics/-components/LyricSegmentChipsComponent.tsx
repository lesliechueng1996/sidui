import { cn } from '@/lib/utils';
import { type LyricSegment, nextLyricSegmentKey } from '../-lib/lyric';
import { lyricColorClassName } from '../-lib/lyric-colors';

type LyricSegmentChipsComponentProps = {
  label: string;
  field: 'text' | 'kana';
  segments: LyricSegment[];
  selectedStart: number | null;
  selectedEnd: number | null;
  onSelect: (index: number) => void;
};

export function LyricSegmentChipsComponent({
  label,
  field,
  segments,
  selectedStart,
  selectedEnd,
  onSelect,
}: LyricSegmentChipsComponentProps) {
  const chipKeys = new Map<string, number>();
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {segments.map((segment, index) => {
          const selected =
            selectedStart !== null &&
            selectedEnd !== null &&
            index >= selectedStart &&
            index <= selectedEnd;

          return (
            <button
              key={nextLyricSegmentKey(chipKeys, field, segment)}
              type="button"
              className={cn(
                lyricColorClassName(segment.color, 'border px-2 py-1 text-sm'),
                selected ? 'ring-2 ring-primary' : 'border-border',
              )}
              onClick={() => onSelect(index)}
            >
              {field === 'text' ? segment.text : segment.kana}
            </button>
          );
        })}
      </div>
    </div>
  );
}
